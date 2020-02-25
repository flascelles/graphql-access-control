//
// Example GraphQL service with sample open banking data which implements access control rules at the resolver
// level by reading a requester subject read from an incoming OAuth token and populated into ApolloServer context.
//
//
//
// author: Francois Lascelles
// creation date: Feb 19, 2020
//
const { ApolloServer, gql } = require('apollo-server');

// the graphQL schema for the open banking example
const typeDefs = gql`
  type Account {
    id: String
    branch: String
    currency: String
    type: String
    balance: String
    owner: String
    nickname: String
  }
  
  type Transfer {
    date: String
    amount: String
    currency: String
    creditor: Account
    debitor: Account
  }

  type Query {  
    accounts: [Account]
    transfers: [Transfer]
  }
`;
// the banking sample data is hardcoded in accompanying data.js source file
const data = require('./data.js');

//
// GraphQL resolvers which filter response data based on the subject of the requester that is populated
// in the context. In this example, this attempts to match the context's subject with the owner property
// of the bank account number
//
const resolvers = {
  Query: {
    accounts: async (root, args, context) => {
      await contextToSubject(context);
      console.log("returning accounts for user " + context.subject);
      // iterate across accounts, only return matching for that user
      let i;
      let output = [];
      for (i = 0; i < data.accounts.length; i++) {
        // add to output only if owner matches
        // this statement is key to the authorization decision illustrated in this example
        if (data.accounts[i].owner.localeCompare(context.subject) == 0) {
          output[output.length] = data.accounts[i];
        }
      }
      console.log("" + output.length + " items");
      return output;
    },
    transfers: async (root, args, context) => {
      await contextToSubject(context);
      console.log("returning transfers for user " + context.subject);
      // iterate across transfers, only return matching for that user
      let i;
      let output2 = [];
      for (i = 0; i < data.transfers.length; i++) {
        // add to output only if owner of creditor account matches
        // this statement is key to the authorization decision illustrated in this example
        if (data.transfers[i].creditor.owner.localeCompare(context.subject) == 0) {
          output2[output2.length] = data.transfers[i];
        }
      }
      console.log("" + output2.length + " items");
      return output2;
    },
  },
};

// fake token processing for when you don't want to interact with a real token service to
// keep dependencies at a minimum when working on isolated GraphQL code
// fake tokens are just base64 objects that have a .subject property
function tokToSubjectFakeToks(tok) {
  let decoded = Buffer.from(tok, 'base64').toString();
  try {
    let ojedTok = JSON.parse(decoded);
    return ojedTok.subject;
  } catch (error) {
    console.log("error while parsing fake token, maybe you are passing a real token instead? " + error);
    return "Fake token failure";
  }
}

// https call to the token service (Ping Federate) token introspection endpoint
// this gets a response back from the token introspection endpoint to decide if
// the token is valid and to get attributes associated with it
function getPingFedPromise(tok) {
  // a real world implementation would not include a client id and hardcoded basic auth token in the code
  // this is just for illustration purposes
  const client_id = 'graphql_client';
  const https = require('https');
  const data = 'token=' + tok + '&client_id=' + client_id;
  const options = {
    hostname: 'localhost',
    port: 9031,
    path: '/as/introspect.oauth2',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic Z3JhcGhxbF9jbGllbnQ6',
      'Content-Length': data.length
    }
  };
  return new Promise((resolve, reject) => {
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    const req = https.request(options, (response) => {
      let chunks_of_data = [];
      response.on('data', (fragments) => {
        chunks_of_data.push(fragments);
      });
      response.on('end', () => {
        let response_body = Buffer.concat(chunks_of_data);
        resolve(response_body.toString());
      });
      response.on('error', (error) => {
        reject(error);
      });
    });
    req.write(data);
    req.end();
  });
}

// ==== TOKEN INTROSPECTION ====
// Introspection for incoming tokens with Ping Federate's OAuth token introspection endpoint
// This is kept simple, and the call out is made out each time, an obvious optimization would
// be to cache introspection results to avoid calling each time
// the Ping Federate oauth introspection endpoint typically returns one of the following two responses:
// 1.                      {
//                           "Username" : "469863216813@example.com",
//                           "active" : true,
//                           "OrgName" : "PingIdentity",
//                           "token_type" : "Bearer",
//                           "exp" : 1582660570,
//                           "client_id" : "graphql_client"
//                         }
//
// 2. (in case of failure) {
//                           "active" : false
//                         }
//
async function tokToSubjectIntrospection(tok) {
  try {
    let http_promise = getPingFedPromise(tok);
    // response_body holds response from server that is passed when Promise is resolved
    let response_body = await http_promise;
    const introspection_response = JSON.parse(response_body);
    if (!introspection_response.active) {
      console.log("Token introspection: The incoming token is invalid or in not active");
      // You may want to return a 401 here
      return "not authenticated";
    } else if (introspection_response.active) {
      // isolate subject
      const username = introspection_response.Username;
      const subject = username.substring(0, username.indexOf('@'));
      return subject;
    } else {
      console.log("Token introspection: Unexpected token introspection response: " + response_body);
      return "Introspection failed";
    }
  } catch(error) {
    // Promise rejected
    console.log(error);
    return "Introspection failed";
  }
}

// SELECT TOKEN MODE HERE
// This is the function which dereferences the requester subject from the incoming token
// you could do this many ways such as decode a JWT or call an external userInfo (e.g. PingFederate)
// endpoint and cache the results from that userInfo endpoint
async function tokToSubject(tok) {
  // Two different ways to accomplish this are implemented, uncomment one or the other

  // Alternative 1
  // in this version, a token introspection endpoint on PingFederate is called to retrieve attributes associated with
  // the token
  // return await tokToSubjectIntrospection(tok);

  // Alternative 2
  // in this alternate version of the code, the tokens are just a base64 encoded javascript object (JSON)
  // see data.js for more info on how to use these tokens in this example
  // this option is made available in order to minimize dependencies with this sample such as external token
  // servers, identity stores, etc
  return tokToSubjectFakeToks(tok);
}

// dereference the requester subject from the incoming request
async function contextToSubject(context) {
  // looking for token from http header authorization using value pattern "Bearer _token_"
  const req = context.request;
  const token = req.headers.authorization || '';

  // Valid token require authorization value to be longer than 7 because it starts with "Bearer "
  if (token.length > 7) {
    // isolate the token from the authorization header value
    let bearertok = token.substring(7);
    // resolve your user subject from the token
    context.subject = await tokToSubject(bearertok);
  } else {
    context.subject = "no subject present";
  }
}

// instantiate Apollo express server with a hook to incorporate incoming request inside the transaction context
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // add the request to the context
    const request = req;
    return {request};
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});