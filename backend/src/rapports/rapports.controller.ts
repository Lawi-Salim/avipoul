import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || 'http://localhost:8000';

@Controller('rapports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RapportsController {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  private async buildPayload(id: string) {
    const cycles = await this.sequelize.query(
      `SELECT * FROM cycles WHERE id = :id LIMIT 1`,
      { replacements: { id }, type: 'SELECT' },
    );
    const cycle = (cycles as any[])[0];

    if (!cycle) return null;

    const mortalites = await this.sequelize.query(
      `SELECT * FROM mortalites WHERE cycle_id = :id ORDER BY date ASC`,
      { replacements: { id }, type: 'SELECT' },
    );

    const depenses = await this.sequelize.query(
      `SELECT * FROM depenses WHERE cycle_id = :id ORDER BY date ASC`,
      { replacements: { id }, type: 'SELECT' },
    );

    const ventesRaw = await this.sequelize.query(
      `SELECT v.date, v.quantite, v.prix_unitaire, v.remise, v.mode_paiement, v.statut_paiement,
              c.nom AS client_nom, c.type_client AS client_type_client
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       WHERE v.cycle_id = :id
       ORDER BY v.date ASC`,
      { replacements: { id }, type: 'SELECT' },
    );

    const ventes = (ventesRaw as any[]).map((v) => ({
      date: v.date,
      quantite: Number(v.quantite),
      prix_unitaire: Number(v.prix_unitaire),
      remise: Number(v.remise) || 0,
      mode_paiement: v.mode_paiement,
      statut_paiement: v.statut_paiement,
      client: v.client_nom
        ? { nom: v.client_nom, type_client: v.client_type_client }
        : null,
    }));

    const totalDepenses = (depenses as any[]).reduce((sum, d) => sum + Number(d.montant), 0);
    const totalVentes = ventes.reduce((sum, v) => sum + (v.quantite * v.prix_unitaire - v.remise), 0);
    const totalQuantite = ventes.reduce((sum, v) => sum + v.quantite, 0);
    const effectifInitial = Number(cycle.effectif_initial) || 0;
    const coutAchatPoussins = Number(cycle.cout_achat_poussins) || 0;
    const coutPoussins = coutAchatPoussins * effectifInitial;
    const coutTotal = coutPoussins + totalDepenses;
    const marge = totalVentes - coutTotal;
    const totalMortalite = (mortalites as any[]).reduce((sum, m) => sum + Number(m.nombre), 0);
    const effectifVivant = effectifInitial - totalMortalite;
    const coutRevientParPoulet = effectifVivant > 0 ? coutTotal / effectifVivant : 0;
    const parametrageRows = await this.sequelize.query(
      `SELECT prix_vente_standard FROM parametrages WHERE actif = true LIMIT 1`,
      { type: 'SELECT' },
    );
    const prixVenteStandard = Number((parametrageRows as any[])[0]?.prix_vente_standard) || 0;
    const seuilRentabilite = prixVenteStandard > 0 ? Math.ceil(coutTotal / prixVenteStandard) : 0;

    return {
      cycle: {
        numero_cycle: Number(cycle.numero_cycle),
        date_reception: cycle.date_reception,
        date_cloture: cycle.date_cloture,
        effectif_initial: effectifInitial,
        phase_courante: cycle.phase_courante,
        cout_achat_poussins: coutAchatPoussins,
        bilan_mortalite_cumulee: Number(cycle.bilan_mortalite_cumulee) || 0,
        statut: cycle.statut,
      },
      mortalites: (mortalites as any[]).map((m) => ({
        date: m.date,
        nombre: Number(m.nombre),
        type: m.type,
        cause: m.cause,
      })),
      depenses: (depenses as any[]).map((d) => ({
        date: d.date,
        montant: Number(d.montant),
        description: d.description,
        categorie: d.categorie,
      })),
      ventes,
      total_ventes_quantite: totalQuantite,
      total_ventes_montant: totalVentes,
      bilan: {
        cout_total: Number(coutTotal.toFixed(2)),
        recettes: Number(totalVentes.toFixed(2)),
        marge: Number(marge.toFixed(2)),
        cout_revient_par_poulet: Number(coutRevientParPoulet.toFixed(2)),
        effectif_vivant: effectifVivant,
        seuil_rentabilite: seuilRentabilite,
      },
    };
  }

  @Get('cycle/:id/pdf')
  async getCyclePdf(@Param('id') id: string, @Res() res: Response) {
    console.log('[PDF] Début génération pour cycle:', id);

    const payload = await this.buildPayload(id);
    if (!payload) {
      console.log('[PDF] Cycle non trouvé pour id:', id);
      res.status(404).send('Cycle non trouvé');
      return;
    }

    if (payload.cycle.statut !== 'cloture') {
      res.status(400).send('Le PDF ne peut être généré que pour un cycle clôturé');
      return;
    }

    console.log('[PDF] Appel service PDF:', PDF_SERVICE_URL);

    let response: globalThis.Response;
    try {
      response = await fetch(`${PDF_SERVICE_URL}/rapport-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.log('[PDF] Erreur fetch:', error);
      res.status(503).send('Le service de génération PDF n\'est pas disponible');
      return;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Erreur inconnue');
      console.log('[PDF] Erreur service PDF:', response.status, errorBody);
      res.status(503).send(`Erreur du service PDF (${response.status}): ${errorBody}`);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    console.log('[PDF] PDF généré avec succès, taille:', pdfBuffer.length, 'octets');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-cycle-${payload.cycle.numero_cycle || id}.pdf"`,
    });

    res.send(pdfBuffer);
  }

  @Get('cycle/:id/html')
  async getCycleHtml(@Param('id') id: string, @Res() res: Response) {
    const payload = await this.buildPayload(id);
    if (!payload) {
      res.status(404).send('Cycle non trouvé');
      return;
    }

    let response: globalThis.Response;
    try {
      response = await fetch(`${PDF_SERVICE_URL}/rapport-cycle-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      res.status(503).send('Le service de rendu HTML n\'est pas disponible');
      return;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Erreur inconnue');
      res.status(503).send(`Erreur du service HTML (${response.status}): ${errorBody}`);
      return;
    }

    const html = await response.text();

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
    });

    res.send(html);
  }

  private async buildFacturePayload(venteId: string) {
    const rows = await this.sequelize.query(
      `SELECT v.*, c.nom AS client_nom, c.type_client AS client_type, c.contact AS client_contact,
              c.email AS client_email, c.adresse AS client_adresse,
              cy.numero_cycle AS cycle_numero
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       LEFT JOIN cycles cy ON v.cycle_id = cy.id
       WHERE v.id = :id
       LIMIT 1`,
      { replacements: { id: venteId }, type: 'SELECT' },
    );

    const row = (rows as any[])[0];
    if (!row) return null;

    const venteDate = new Date(row.date);
    const yyyy = venteDate.getFullYear();
    const mm = String(venteDate.getMonth() + 1).padStart(2, '0');

    const countResult = await this.sequelize.query(
      `SELECT COUNT(*)::int AS cnt FROM ventes v2
       WHERE EXTRACT(YEAR FROM v2.date) = :year AND EXTRACT(MONTH FROM v2.date) = :month`,
      { replacements: { year: yyyy, month: parseInt(mm) }, type: 'SELECT' },
    );
    const seq = ((countResult as any[])[0]?.cnt || 0);
    const numero = `FAC-${yyyy}${mm}-${String(seq).padStart(6, '0')}`;

    const dateEmission = venteDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const echeanceDate = new Date(venteDate);
    echeanceDate.setDate(echeanceDate.getDate() + 7);
    const dateEcheance = echeanceDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const quantite = Number(row.quantite);
    const prixUnitaire = Number(row.prix_unitaire);
    const sousTotal = quantite * prixUnitaire;
    const remise = Number(row.remise) || 0;
    const total = sousTotal - remise;
    const remisePct = sousTotal > 0 ? Math.round((remise / sousTotal) * 10000) / 100 : 0;

    const typeClientMap: Record<string, string> = {
      menage: 'Ménage',
      restaurant: 'Restaurant',
      hotel: 'Hôtel',
      boucherie: 'Boucherie',
      revendeur: 'Revendeur',
    };

    const categorieMap: Record<string, string> = {
      poulet_vif: 'Poulet de chair, vif',
      poulet_abattu: 'Poulet de chair abattu',
      poulet_entier: 'Poulet de chair entier',
      poulet_fermier: 'Poulet de chair fermier',
      poulet_morceaux: 'Poulet de chair en morceaux',
      poulet_cuisse: 'Cuisses de poulet',
      poulet_ailes: 'Ailes de poulet',
    };

    return {
      facture: {
        numero,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        cycle_reference: row.cycle_numero ? `Cycle #${row.cycle_numero}` : '—',
        mode_paiement: row.mode_paiement,
        statut: row.statut_paiement,
        conditions: '7 jours net',
        notes: `Total ${quantite} poulets.`,
        sous_total: sousTotal,
        remise: remise,
        remise_pct: remisePct,
        total: total,
      },
      client: {
        nom: row.client_nom || 'Client inconnu',
        type: typeClientMap[row.client_type] || row.client_type || '—',
        contact: row.client_contact || '',
        email: row.client_email || '',
        adresse: row.client_adresse || '',
      },
      articles: [
        {
          designation: categorieMap[row.categorie_produit] || 'Poulet de chair',
          quantite,
          prix_unitaire: prixUnitaire,
          total: sousTotal,
        },
      ],
    };
  }

  private async generateSuffix(year: number, month: number): Promise<string> {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const countResult = await this.sequelize.query(
      `SELECT COUNT(*)::int AS cnt FROM ventes v
       WHERE EXTRACT(YEAR FROM v.date) = :year
         AND EXTRACT(MONTH FROM v.date) = :month`,
      { replacements: { year, month }, type: 'SELECT' },
    );
    const seq = ((countResult as any[])[0]?.cnt || 0) + 1;
    if (seq <= 999999) {
      return String(seq).padStart(6, '0');
    }
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  private async buildFactureGroupeePayload(clientId: string, cycleId: string) {
    console.log('[buildFactureGroupeePayload] Recherche ventes pour clientId:', clientId, 'cycleId:', cycleId);

    const rows = await this.sequelize.query(
      `SELECT v.*, c.nom AS client_nom, c.type_client AS client_type, c.contact AS client_contact,
              c.email AS client_email, c.adresse AS client_adresse,
              cy.numero_cycle AS cycle_numero
       FROM ventes v
       LEFT JOIN clients c ON v.client_id = c.id
       LEFT JOIN cycles cy ON v.cycle_id = cy.id
       WHERE v.client_id = :clientId AND v.cycle_id = :cycleId
       ORDER BY v.date ASC`,
      { replacements: { clientId, cycleId }, type: 'SELECT' },
    );

    console.log('[buildFactureGroupeePayload] Résultat:', (rows as any[]).length, 'vente(s) trouvée(s)');

    if (!(rows as any[]).length) return null;

    const row = (rows as any[])[0];
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const suffix = await this.generateSuffix(yyyy, now.getMonth() + 1);
    const numero = `FAC-${yyyy}${mm}-${suffix}`;

    const dateEmission = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const echeanceDate = new Date(now);
    echeanceDate.setDate(echeanceDate.getDate() + 7);
    const dateEcheance = echeanceDate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const ventes = (rows as any[]).map((r) => ({
      quantite: Number(r.quantite),
      prix_unitaire: Number(r.prix_unitaire),
      montant_total: Number(r.quantite) * Number(r.prix_unitaire),
      remise: Number(r.remise) || 0,
      statut_paiement: r.statut_paiement,
      date: r.date,
    }));

    const totalQuantite = ventes.reduce((sum, v) => sum + v.quantite, 0);
    const totalMontant = ventes.reduce((sum, v) => sum + v.montant_total, 0);
    const totalRemise = ventes.reduce((sum, v) => sum + v.remise, 0);
    const total = totalMontant - totalRemise;
    const remisePct = totalMontant > 0 ? Math.round((totalRemise / totalMontant) * 10000) / 100 : 0;

    const statuts = ventes.map((v) => v.statut_paiement);
    const statutGlobal = statuts.every((s) => s === 'paye') ? 'paye' : 'impaye';

    const typeClientMap: Record<string, string> = {
      menage: 'Ménage',
      restaurant: 'Restaurant',
      hotel: 'Hôtel',
      boucherie: 'Boucherie',
      revendeur: 'Revendeur',
    };

    const categorieMap: Record<string, string> = {
      poulet_vif: 'Poulet de chair, vif',
      poulet_abattu: 'Poulet de chair abattu',
      poulet_entier: 'Poulet de chair entier',
      poulet_fermier: 'Poulet de chair fermier',
      poulet_morceaux: 'Poulet de chair en morceaux',
      poulet_cuisse: 'Cuisses de poulet',
      poulet_ailes: 'Ailes de poulet',
    };

    const articles = ventes.map((v, i) => ({
      designation: categorieMap[(rows as any[])[i].categorie_produit] || 'Poulet de chair',
      quantite: v.quantite,
      prix_unitaire: v.prix_unitaire,
      total: v.montant_total,
    }));

    return {
      facture: {
        numero,
        date_emission: dateEmission,
        date_echeance: dateEcheance,
        cycle_reference: `Cycle #${row.cycle_numero || '—'}`,
        mode_paiement: row.mode_paiement,
        statut: statutGlobal,
        conditions: '7 jours net',
        notes: `Total ${totalQuantite} poulets pour ce client.`,
        sous_total: totalMontant,
        remise: totalRemise,
        remise_pct: remisePct,
        total: total,
      },
      client: {
        nom: row.client_nom || 'Client inconnu',
        type: typeClientMap[row.client_type] || row.client_type || '—',
        contact: row.client_contact || '',
        email: row.client_email || '',
        adresse: row.client_adresse || '',
      },
      articles,
    };
  }

  @Roles('admin', 'comptable')
  @Get('facture-groupee/:clientId/:cycleId/pdf')
  async getFactureGroupeePdf(
    @Param('clientId') clientId: string,
    @Param('cycleId') cycleId: string,
    @Res() res: Response,
  ) {
    console.log('[PDF Facture Groupée] Début génération pour client:', clientId, 'cycle:', cycleId);

    const payload = await this.buildFactureGroupeePayload(clientId, cycleId);
    if (!payload) {
      console.log('[PDF Facture Groupée] Aucune vente trouvée pour client:', clientId, 'cycle:', cycleId);
      res.status(404).send('Aucune vente trouvée pour ce client et ce cycle');
      return;
    }

    let response: globalThis.Response;
    try {
      response = await fetch(`${PDF_SERVICE_URL}/facture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      res.status(503).send('Le service de génération PDF n\'est pas disponible');
      return;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Erreur inconnue');
      res.status(503).send(`Erreur du service PDF (${response.status}): ${errorBody}`);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${payload.facture.numero}.pdf"`,
    });

    res.send(pdfBuffer);
  }

  @Roles('admin', 'comptable')
  @Get('facture-groupee/:clientId/:cycleId/html')
  async getFactureGroupeeHtml(
    @Param('clientId') clientId: string,
    @Param('cycleId') cycleId: string,
    @Res() res: Response,
  ) {
    console.log('[HTML Facture Groupée] Début rendu pour client:', clientId, 'cycle:', cycleId);

    const payload = await this.buildFactureGroupeePayload(clientId, cycleId);
    if (!payload) {
      console.log('[HTML Facture Groupée] Aucune vente trouvée pour client:', clientId, 'cycle:', cycleId);
      res.status(404).send('Aucune vente trouvée pour ce client et ce cycle');
      return;
    }

    let response: globalThis.Response;
    try {
      response = await fetch(`${PDF_SERVICE_URL}/facture-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      res.status(503).send('Le service de rendu HTML n\'est pas disponible');
      return;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Erreur inconnue');
      res.status(503).send(`Erreur du service HTML (${response.status}): ${errorBody}`);
      return;
    }

    const html = await response.text();

    res.set({ 'Content-Type': 'text/html; charset=utf-8' });
    res.send(html);
  }

  @Roles('admin', 'comptable')
  @Get('facture/:id/pdf')
  async getFacturePdf(@Param('id') id: string, @Res() res: Response) {
    console.log('[PDF Facture] Début génération pour vente:', id);

    const payload = await this.buildFacturePayload(id);
    if (!payload) {
      console.log('[PDF Facture] Vente non trouvée pour id:', id);
      res.status(404).send('Vente non trouvée');
      return;
    }

    console.log('[PDF Facture] Appel service PDF:', PDF_SERVICE_URL);

    let response: globalThis.Response;
    try {
      response = await fetch(`${PDF_SERVICE_URL}/facture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.log('[PDF Facture] Erreur fetch:', error);
      res.status(503).send('Le service de génération PDF n\'est pas disponible');
      return;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Erreur inconnue');
      console.log('[PDF Facture] Erreur service PDF:', response.status, errorBody);
      res.status(503).send(`Erreur du service PDF (${response.status}): ${errorBody}`);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    console.log('[PDF Facture] PDF généré avec succès, taille:', pdfBuffer.length, 'octets');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="facture-${payload.facture.numero || id}.pdf"`,
    });

    res.send(pdfBuffer);
  }

  @Roles('admin', 'comptable')
  @Get('facture/:id/html')
  async getFactureHtml(@Param('id') id: string, @Res() res: Response) {
    const payload = await this.buildFacturePayload(id);
    if (!payload) {
      res.status(404).send('Vente non trouvée');
      return;
    }

    let response: globalThis.Response;
    try {
      response = await fetch(`${PDF_SERVICE_URL}/facture-html`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      res.status(503).send('Le service de rendu HTML n\'est pas disponible');
      return;
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Erreur inconnue');
      res.status(503).send(`Erreur du service HTML (${response.status}): ${errorBody}`);
      return;
    }

    const html = await response.text();

    res.set({
      'Content-Type': 'text/html; charset=utf-8',
    });

    res.send(html);
  }
}
