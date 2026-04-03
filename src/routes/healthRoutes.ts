import { Router, Request, Response } from 'express';

const router = Router();
const startTime = Date.now();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health status
 *     tags: [Health]
 *     description: Returns the health status and uptime of the API
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 uptime:
 *                   type: number
 *                   description: Uptime in milliseconds
 *                   example: 123456
 */
router.get('/health', (_req: Request, res: Response) => {
  const uptime = Date.now() - startTime;
  
  res.status(200).json({
    status: 'healthy',
    version: '1.0.0',
    uptime: uptime
  });
});

export default router;
