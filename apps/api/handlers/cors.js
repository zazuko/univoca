import cors from 'cors'

export const middleware = () => cors({
  allowedHeaders: ['Authorization', 'content-type'],
  exposedHeaders: ['Link', 'Location'],
  origin: 'https://app.univoca.lndo.site',
})
