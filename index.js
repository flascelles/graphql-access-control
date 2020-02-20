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
    accounts: (root, args, context) => {
      console.log("returning accounts for user " + context.subject);
      // iterate across accounts, only return matching for that user
      let i;
      let output = [];
      for (i = 0; i < data.accounts.length; i++) {
        // add to output only if owner matches
        // this statement is key to the authorization decision illustrated in this example
        if (data.accounts[i].owner.localeCompare(context.subject)) {
          output[output.length] = data.accounts[i];
        }
      }
      return output;
    },
    transfers: (root, args, context) => {
      console.log("returning transfers for user " + context.subject);
      // iterate across transfers, only return matching for that user
      let i;
      let output2 = [];
      for (i = 0; i < data.transfers.length; i++) {
        // add to output only if owner of creditor account matches
        // this statement is key to the authorization decision illustrated in this example
        if (data.transfers[i].creditor.owner.localeCompare(context.subject)) {
          output2[output2.length] = data.transfers[i];
        }
      }
      return output2;
    },
  },
};

//
// this is the function which dereferences the requester subject from the incoming token
// you could do this many ways such as decode a JWT or call an external userInfo (e.g. PingFederate)
// endpoint and cache the results from that userInfo endpoint
//
function tokToSubject(tok) {
  // Two different ways to accomplish this are suggested, uncomment one or the other

  // Alternative 1
  // in this version, a userinfo endpoint on PingFederate is called to retrieve attributes assocaited with
  // the token
  // todo

  // Alternative 2
  // in this alternate version of the code, the tokens are just a base64 encoded javascript object (JSON)
  // see data.js for more info on how to use these tokens in this example
  // this option is made available in order to minimize dependencies with this sample such as external token
  // servers, identity stores, etc
  let decoded = Buffer.from(tok, 'base64').toString();
  console.log("decoded " + decoded);
  let ojedTok = JSON.parse(decoded);
  return ojedTok.subject;
}

//
// dereference the requester subject from the incoming request
//
function reqToSubject(req) {
  // looking for token from http header authorization using value pattern "Bearer _token_"
  const token = req.headers.authorization || '';

  // Valid token require authorization value to be longer than 7 because it starts with "Bearer "
  if (token.length > 7) {
    // isolate the token from the authorization header value
    let bearertok = token.substring(7);
    console.log("incoming token= " + bearertok);
    // resolve your user subject from the token
    return tokToSubject(bearertok);
  } else {
    return "anonymous";
  }
}

// instantiate Apollo express server with a hook to incorporate a requester subject inside the transaction context
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // try to retrieve a user with the token
    const subject = reqToSubject(req);
    // add the user to the context
    return { subject };
  },
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});

