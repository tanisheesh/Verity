import { Router, Request, Response } from 'express';
import { Analyzer } from '../components/Analyzer';
import { ConversationAnalyzer } from '../components/ConversationAnalyzer';
import { AnalyzerInput } from '../models';
import { logger } from '../utils/logger';

const router = Router();
const analyzer = new Analyzer();
const conversationAnalyzer = new ConversationAnalyzer();

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     summary: Analyze text for deception indicators
 *     tags: [Analysis]
 *     description: Analyzes a single message or conversation for linguistic deception patterns using 9 NLP layers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: The text to analyze (single message or conversation with line breaks)
 *                 example: "I went to the store at 3pm yesterday. I bought milk, bread, and eggs."
 *               mode:
 *                 type: string
 *                 enum: [single, conversation]
 *                 default: single
 *                 description: Analysis mode - single for one message, conversation for multiple messages
 *               options:
 *                 type: object
 *                 description: Optional analysis configuration
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Analysis results (structure varies by mode)
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 requestId:
 *                   type: string
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "INVALID_INPUT"
 *                     message:
 *                       type: string
 *                       example: "Text field is required"
 *       500:
 *         description: Internal server error
 */
router.post('/analyze', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const { text, mode, options }: AnalyzerInput = req.body;

    logger.debug('Analysis request received', { 
      textLength: text?.length, 
      mode 
    });

    if (!text) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Text field is required'
        },
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      });
    }

    // Handle conversation mode
    if (mode === 'conversation') {
      const result = await conversationAnalyzer.analyzeConversation(text);
      return res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      });
    }

    // Handle single message mode
    const input: AnalyzerInput = { text, mode: mode || 'single', options };
    const result = await analyzer.analyze(input);

    if (!result.success) {
      const statusCode = getStatusCodeForError(result.error?.code);
      logger.warn('Analysis failed', { 
        error: result.error, 
        duration: Date.now() - startTime 
      });
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
        requestId: generateRequestId()
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    });

  } catch (error) {
    logger.error('Unexpected error in analyze endpoint', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      },
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    });
  }
});

function getStatusCodeForError(code?: string): number {
  switch (code) {
    case 'TEXT_TOO_SHORT':
    case 'TEXT_TOO_LONG':
    case 'INVALID_INPUT':
      return 400;
    case 'ANALYSIS_FAILED':
    case 'INTERNAL_ERROR':
      return 500;
    default:
      return 500;
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default router;
