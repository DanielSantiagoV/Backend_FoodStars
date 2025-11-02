import passport from 'passport';
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import dotenv from "dotenv";
import { obtenerBD } from './db.js';
import { ObjectId } from 'mongodb';

dotenv.config();

const options = {
    secretOrKey: process.env.JWT_SECRET_KEY,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};

passport.use(
    new JwtStrategy(options, async (payLoad,done)=>{
        try {
            const user = await obtenerBD().collection("usuarios")
            .findOne({_id: new ObjectId(payLoad.id)});

            if(!user) return done(null, false);
            return done(null, user);
        } catch (error) {
            done(error, false);
        }
    })
)

export default passport;