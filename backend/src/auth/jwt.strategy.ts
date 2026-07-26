import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.entity.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'avipoul-secret-key',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.userModel.findByPk(payload.sub);
    if (!user || !user.actif) {
      throw new UnauthorizedException('Utilisateur non trouvé ou inactif');
    }
    return { id: user.id, nom: user.nom, email: user.email, role: user.role };
  }
}
