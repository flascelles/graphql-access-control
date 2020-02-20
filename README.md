# GraphQL Access Control banking sample
Example Apollo GraphQL service with sample open banking data which implements access control rules at the resolver level by reading a requester subject dereferenced from an incoming OAuth token and populated into the ApolloServer context.

This illustrates basic access control in which the banking accounts returned by the GraphQL queries are only the ones that are associated with the requester of the query as identified by the incoming token attached to the query.

Adding the requester subject into the context is done as part of the Apollo server instantiation (see `index.js`):
 ```
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
```
The banking data is populated with object that have an _owner_ attribute that can be used to match the ownership of the bank account with the subject of the requester (see `data.js`):
```
exports.accounts = [
    {
        id: '516236577',
        branch: '31801',
        currency: 'CAD',
        type: 'Checking',
        balance: '$6,832.14',
        owner: '469863216813',
        nickname: 'Checking',
    },
    {
        id: '516236582',
        branch: '31801',
        currency: 'CAD',
        type: 'Savings',
        balance: '$37,851.64',
        owner: '469863216813',
        nickname: 'Savings',
    },
...
];
```
 
The enforcement of the access control rules is done at the GraphQL resolver level.
```
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
```

## Running the GraphQL server sample

Step 1 - Clone repo
```sh
git clone https://github.com/flascelles/graphql-access-control
cd graphql-access-control
```
Step 2 - Initialize a new Node.js project:
```
npm init --yes
```
Step 3 - Run the following command to install both of these dependencies and save them in your project's node_modules directory:
```
npm install apollo-server graphql
```
Step 4 - Start Apollo server:
```
node index.js
```
Result - You should see the following output:
```
🚀 Server ready at http://localhost:4000/
```

## Querying the server using Postman

You can query the GraphQL API by using the Postman collection provided. Open Postman, click `Import`, click `Choose Files` and select the file from this repo `Banking GraphQL Samples.postman_collection.json` 

Two Sample GraphQL queries are provided (one for each sample user in the hardcoded data). You can modify the parameters of the Query by opening the Request Body field in Postman.
![](images/postman1.png)


