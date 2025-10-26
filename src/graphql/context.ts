/**
 * GraphQL Context Types
 * Defines the context available to all resolvers
 */

import { SuiClient } from '@mysten/sui/client';
import { DatabaseService } from '../services/database.service';
import { PriceService } from '../services/price.service';
import { CronService } from '../services/cron.service';

/**
 * GraphQL context interface
 * This is passed to all resolvers and contains database and service instances
 */
export interface GraphQLContext {
  db: DatabaseService;
  database: D1Database;
  suiClient: SuiClient;
  priceService: typeof PriceService;
  cronService: typeof CronService;
}
