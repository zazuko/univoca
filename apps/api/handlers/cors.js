import cors from 'cors'

export const middleware = () => cors({
  allowedHeaders: ['Authorization'],
  exposedHeaders: ['Link'],
  origin: 'https://app.univoca.lndo.site',
})
