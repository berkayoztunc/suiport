/**
 * MCP Server for SuiPort
 * Provides Model Context Protocol server for AI assistants to query wallet balances and token prices
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SuiClient } from '@mysten/sui/client';
import { getWalletBalance, getTokenPrice } from './tools';
import { MCPContext } from './types';

/**
 * MCP Server for Cloudflare Workers
 * This provides a JSON-RPC interface for AI assistants to interact with SuiPort APIs
 */
export class SuiPortMCPServer {
  private server: Server;
  private context: MCPContext;

  constructor(database: D1Database, suiClient: SuiClient) {
    this.context = {
      database,
      suiClient
    };

    this.server = new Server(
      {
        name: 'suiport-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  /**
   * Setup MCP tool handlers
   */
  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = [
        {
          name: 'get_wallet_balance',
          description: 'Get the balance and token holdings of a SUI wallet address. Returns total USD value and detailed information about each token held.',
          inputSchema: {
            type: 'object',
            properties: {
              address: {
                type: 'string',
                description: 'The SUI wallet address to query (e.g., 0x...)',
              },
            },
            required: ['address'],
          },
        },
        {
          name: 'get_token_price',
          description: 'Get the current USD price of a token on the SUI blockchain. Supports all tokens available in the SuiPort database.',
          inputSchema: {
            type: 'object',
            properties: {
              tokenType: {
                type: 'string',
                description: 'The full token type/address (e.g., 0x2::sui::SUI for SUI token)',
              },
            },
            required: ['tokenType'],
          },
        },
      ];

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_wallet_balance': {
            const result = await getWalletBalance(
              args as any,
              this.context.database,
              this.context.suiClient
            );

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_token_price': {
            const result = await getTokenPrice(
              args as any,
              this.context.database
            );

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error?.message || 'Tool execution failed',
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Handle MCP request via HTTP (for Cloudflare Workers)
   */
  async handleRequest(request: Request): Promise<Response> {
    try {
      // Parse JSON-RPC request
      const body = await request.json() as any;

      // Create a mock transport for handling the request
      let responseData: any = null;

      if (body.method === 'tools/list') {
        const handler = (this.server as any)['_requestHandlers']?.get('tools/list');
        if (handler) {
          responseData = await handler(body.params || {}, {} as any);
        }
      } else if (body.method === 'tools/call') {
        const handler = (this.server as any)['_requestHandlers']?.get('tools/call');
        if (handler) {
          responseData = await handler({ params: body.params }, {} as any);
        }
      } else {
        throw new Error(`Unknown method: ${body.method}`);
      }

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: body.id,
          result: responseData,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error: any) {
      console.error('[MCP] Error handling request:', error);
      
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: error?.message || 'Internal error',
          },
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  /**
   * Get the underlying server instance
   */
  getServer(): Server {
    return this.server;
  }
}

/**
 * Create and initialize MCP server
 */
export function createMCPServer(database: D1Database, suiClient: SuiClient): SuiPortMCPServer {
  return new SuiPortMCPServer(database, suiClient);
}
