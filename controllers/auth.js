import config from 'config'
import jwt from 'jwt-simple'
import passport from 'koa-passport'
import User from '../db/models/User'

export default router => {
    router.get('/check', ctx => {
        ctx.body = ctx.isAuthenticated() ? ctx.state.user : false
    }).post('/login', async (ctx, next) => {
        await passport.authenticate('local', { session: false })(ctx, next)
        if (ctx.state.user) {
            const payload = {
                id: ctx.state.user.id,
                name: ctx.state.user.name
            }
            const token = jwt.encode(payload, config.jwtSecret)
            ctx.body = {token, message: 'Вы успешно авторизованы!'}
        } else {
            ctx.status = 400
            ctx.body = {message: 'Invalid credentials'}
        }
    }).post('/register', async (ctx, next) => {
        try {
            await User.create(ctx.request.body)
            ctx.body = { message: 'Вы успешно зарегистрированы!'}
        } catch (e) {
            ctx.throw(400, e)
        }
    }).post('/logout', ctx => {
        ctx.logout()
        ctx.session = null
        ctx.redirect('/')
    }).get('/private', async (ctx, next) => {
        await passport.authenticate('jwt', {session: false})(ctx, next)

        if (!ctx.state.user) {
            ctx.status = 400
            ctx.body = {error: 'invalid credentials'}
            return
        }

        ctx.body = {
            private: 'top most secret info',
            email: ctx.state.user.email
        }
    })
}
