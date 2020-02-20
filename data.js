//
// Hardcoded open banking data
//
// Fake tokens to be used by requester:
//   eyJzdWJqZWN0IjoiNDY5ODYzMjE2ODEzIiwic2NvcGVzIjoibmFtZXMifQ==
//   eyJzdWJqZWN0IjoiNDY3NzQ1ODYzMjQyIiwic2NvcGVzIjoibmFtZXMifQ==
// e.g. http header Authorization: Bearer eyJzdWJqZWN0IjoiNDY3NzQ1ODYzMjQyIiwic2NvcGVzIjoibmFtZXMifQ==
//
// Tokens map to the following object (the subject attributes map to the
// account 'owner' attributes in the data below)
//   {"subject":"469863216813","scopes":"names"}
//   {"subject":"467745863242","scopes":"names"}
// These fake tokens are just the base64 encoded javascript objects
//
// author: Francois Lascelles
// creation date: Feb 19, 2020
//
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
    {
        id: '516236631',
        branch: '31801',
        currency: 'CAD',
        type: 'Credit Card',
        balance: '-$11,278.40',
        owner: '469863216813',
        nickname: 'Family Visa',
    },
    {
        id: '745586325',
        branch: '31801',
        currency: 'CAD',
        type: 'Checking',
        balance: '$782.14',
        owner: '467745863242',
        nickname: 'Checking',
    },
    {
        id: '745586331',
        branch: '31801',
        currency: 'CAD',
        type: 'Savings',
        balance: '$1,875.65',
        owner: '467745863242',
        nickname: 'Savings',
    },
    {
        id: '745586340',
        branch: '31801',
        currency: 'CAD',
        type: 'Credit Card',
        balance: '-$3,887.40',
        owner: '467745863242',
        nickname: 'Meg\'s Amex',
    },
];

exports.transfers = [
    {
        date: 'Fri Feb 21 21:31:20 UTC 2019',
        amount: '$9,874.25',
        currency: 'CAD',
        creditor: {
            id: '516236577',
            branch: '31801',
            currency: 'CAD',
            type: 'Checking',
            balance: '$6,832.14',
            owner: '469863216813',
            nickname: 'Checking',
        },
        debitor: {
            id: '516236631',
            branch: '31801',
            currency: 'CAD',
            type: 'Credit Card',
            balance: '-$11,278.40',
            owner: '469863216813',
            nickname: 'Family Visa',
        },
    },
    {
        date: 'Thu Feb 20 16:31:20 UTC 2019',
        amount: '$9,874.25',
        currency: 'CAD',
        creditor: {
            id: '745586331',
            branch: '31801',
            currency: 'CAD',
            type: 'Savings',
            balance: '$1,875.65',
            owner: '467745863242',
            nickname: 'Savings',
        },
        debitor: {
            id: '745586325',
            branch: '31801',
            currency: 'CAD',
            type: 'Checking',
            balance: '$782.14',
            owner: '467745863242',
            nickname: 'Checking',
        },
    },
];