import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import express from 'express'; import cors from 'cors'; import helmet from 'helmet'; import swaggerUi from 'swagger-ui-express';
import { env,databaseConfigured } from './config/env.js'; import { prisma } from './config/prisma.js'; import { errorHandler,notFound,asyncHandler } from './utils/errors.js'; import { authRouter } from './modules/auth/auth.routes.js'; import { communityRouter } from './modules/communities/community.routes.js'; import { savingsRouter } from './modules/savings/savings.routes.js'; import { loanRouter } from './modules/loans/loan.routes.js'; import { productRouter } from './modules/products/product.routes.js'; import { inventoryRouter } from './modules/inventory/inventory.routes.js'; import { paymentRouter } from './modules/payments/payment.routes.js'; import { aiRouter } from './modules/ai/ai.routes.js';
export const app=express(); app.disable('x-powered-by');
// Render (and most hosts) sit behind one proxy. Needed so login rate limiting sees the real visitor IP.
app.set('trust proxy', 1);
// blob: lets the AI Planner preview the uploaded photo. No https upgrade locally so `npm start` works on http://localhost.
app.use(helmet({contentSecurityPolicy:{directives:{'img-src':["'self'",'data:','blob:'],'upgrade-insecure-requests':env.NODE_ENV==='production'?[]:null}}})); app.use(cors({origin:env.CORS_ORIGIN.split(',').map(x=>x.trim()),credentials:true})); app.use(express.json({limit:'2mb'}));
const openapi={openapi:'3.0.3',info:{title:'Village Banking API',version:'1.0.0'},servers:[{url:'/api/v1'}],paths:{'/health':{get:{summary:'Application and database health',responses:{'200':{description:'Application is healthy'},'503':{description:'Application healthy; database unavailable'}}}}},components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'}}}};
app.use('/api/docs',swaggerUi.serve,swaggerUi.setup(openapi));
app.get('/api/v1/health',asyncHandler(async(_req,res)=>{let database:{status:string;configured:boolean;message?:string}={status:'unavailable',configured:databaseConfigured}; if(prisma){try{await prisma.$queryRaw`SELECT 1`;database={status:'connected',configured:true}}catch{database={status:'unavailable',configured:true,message:'Database connection failed'}}}else database.message='DATABASE_URL is not configured'; res.status(database.status==='connected'?200:503).json({data:{application:{status:'healthy'},database,timestamp:new Date().toISOString()}});}));
// Liveness check for the host: the server is up, whether or not a database is configured
app.get('/api/v1/health/live',(_req,res)=>{res.json({data:{status:'ok'}})});
app.use('/api/v1/auth',authRouter); app.use('/api/v1/communities',communityRouter); app.use('/api/v1',savingsRouter,loanRouter,productRouter,inventoryRouter,paymentRouter); app.use('/api/v1/ai',aiRouter);

// Single app: serve the built React frontend (root dist/) from this same server.
// Works from src/ (tsx, two levels up) and from the compiled dist/src/ (three levels up).
const here = path.dirname(fileURLToPath(import.meta.url));
const webDir = [process.env.WEB_DIR, path.resolve(here, '../../dist'), path.resolve(here, '../../../dist')]
  .find((d): d is string => Boolean(d) && fs.existsSync(path.join(d as string, 'index.html')));
if (webDir) {
  app.use(express.static(webDir));
  // Any non-API page (e.g. a refresh on /savings) gets the React app
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(webDir, 'index.html')));
} else {
  console.warn('[web] Frontend build not found. Run "npm run build" in the project root before "npm start".');
  app.get('/', (_req, res) => res.status(503).json({ error: { code: 'FRONTEND_NOT_BUILT', message: 'The API is running but the frontend was not built. Build with "npm install --include=dev && npm run build" from the project root.' } }));
}

app.use(notFound); app.use(errorHandler);
