const jwt = require('jsonwebtoken');

function requireAuth(req, res,next){
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token){
        const err = new Error('Missing or malformed Authorization headrer');
        err.status = 401;
        return next(err);
    }

    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {id: payload.id};
        next();
    }catch(e){
        const err = new Error('Invalid or expired token');
        err.status = 401;
        return next(err);
    }
}

module.exports = {requireAuth};