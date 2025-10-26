/**
 * GraphQL Server Configuration
 * Creates and configures the GraphQL Yoga server
 */

import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { GraphQLContext } from './context';

/**
 * Create GraphQL schema with type definitions and resolvers
 */
export const schema = createSchema({
  typeDefs,
  resolvers,
});

/**
 * Create GraphQL Yoga server
 */
export const createGraphQLServer = () => {
  return createYoga<GraphQLContext>({
    schema,
    graphqlEndpoint: '/graphql',
    landingPage: false,
    // Enable GraphQL Playground in development
    graphiql: {
      title: 'SuiPort GraphQL API',
    },
  });
};
