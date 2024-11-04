/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/shop_cart.json`.
 */
export type ShopCart = {
  "address": "Ghjt9quQKYs9yHANEUaVHPaBFfmhTECeERSKU9q9SjKa",
  "metadata": {
    "name": "shopCart",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "depositSol",
      "discriminator": [
        108,
        81,
        78,
        117,
        125,
        155,
        56,
        200
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "transactionHistory",
          "writable": true
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializeVault",
      "discriminator": [
        48,
        191,
        163,
        44,
        71,
        129,
        63,
        164
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "seller"
              }
            ]
          }
        },
        {
          "name": "transactionHistory",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  105,
                  115,
                  116,
                  111,
                  114,
                  121
                ]
              },
              {
                "kind": "account",
                "path": "vault"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "bump",
          "type": "u8"
        },
        {
          "name": "minBalance",
          "type": "u64"
        }
      ]
    },
    {
      "name": "paySol",
      "discriminator": [
        131,
        101,
        154,
        50,
        37,
        136,
        13,
        67
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "transactionHistory",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refundSol",
      "discriminator": [
        158,
        68,
        131,
        114,
        106,
        77,
        56,
        13
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "transactionHistory",
          "writable": true
        },
        {
          "name": "buyer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdrawSol",
      "discriminator": [
        145,
        131,
        74,
        136,
        65,
        137,
        42,
        38
      ],
      "accounts": [
        {
          "name": "vault",
          "writable": true
        },
        {
          "name": "transactionHistory",
          "writable": true
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "transactionHistory",
      "discriminator": [
        134,
        21,
        169,
        239,
        149,
        30,
        110,
        78
      ]
    },
    {
      "name": "vaultAccount",
      "discriminator": [
        230,
        251,
        241,
        83,
        139,
        202,
        93,
        28
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidAmount",
      "msg": "Invalid amount."
    },
    {
      "code": 6001,
      "name": "insufficientBalance",
      "msg": "Insufficient balance."
    },
    {
      "code": 6002,
      "name": "belowMinimumBalance",
      "msg": "Cannot withdraw below minimum balance."
    },
    {
      "code": 6003,
      "name": "noRefundPending",
      "msg": "No refund request."
    }
  ],
  "types": [
    {
      "name": "transactionData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "transactionId",
            "type": "pubkey"
          },
          {
            "name": "transactionType",
            "type": "string"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "date",
            "type": "i64"
          },
          {
            "name": "description",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "transactionHistory",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "vault",
            "type": "pubkey"
          },
          {
            "name": "transactions",
            "type": {
              "vec": {
                "defined": {
                  "name": "transactionData"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "vaultAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "balance",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "minBalance",
            "type": "u64"
          },
          {
            "name": "transactionHistory",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
