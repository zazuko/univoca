import cors from 'cors'

export const middleware = () => cors({
  allowedHeaders: ['Link'],
  origin: 'https://app.univoca.lndo.site',
})
