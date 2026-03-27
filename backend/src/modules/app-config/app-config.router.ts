// src/modules/app-config/app-config.router.ts
import { Router } from 'express';
import { appConfigController } from './app-config.controller';

const router = Router();

/**
 * Uygulama açılışında çağrılan konfigürasyon endpoint'i.
 * Auth gerektirmez.
 */
router.get('/', appConfigController.getConfig);

export { router as appConfigRouter };
