import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Can create profile and retrieve it",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('nebulo', 'create-profile', [
        types.ascii("Alice"),
        types.ascii("Blockchain enthusiast")
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    let profileBlock = chain.mineBlock([
      Tx.contractCall('nebulo', 'get-profile', [
        types.principal(wallet1.address)
      ], wallet1.address)
    ]);
    
    let profile = profileBlock.receipts[0].result.expectOk().expectSome();
    assertEquals(profile['name'], "Alice");
    assertEquals(profile['bio'], "Blockchain enthusiast");
  },
});

Clarinet.test({
  name: "Can create post and tip it",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    // Mint some tokens for testing
    let mintBlock = chain.mineBlock([
      Tx.contractCall('nebulo', 'mint', [
        types.uint(1000),
        types.principal(wallet2.address)
      ], deployer.address)
    ]);
    
    // Create post
    let postBlock = chain.mineBlock([
      Tx.contractCall('nebulo', 'create-post', [
        types.ascii("Hello Nebulo!")
      ], wallet1.address)
    ]);
    
    let postId = postBlock.receipts[0].result.expectOk();
    
    // Tip the post
    let tipBlock = chain.mineBlock([
      Tx.contractCall('nebulo', 'tip-post', [
        postId,
        types.uint(100)
      ], wallet2.address)
    ]);
    
    tipBlock.receipts[0].result.expectOk().expectBool(true);
    
    // Check post tips
    let getPostBlock = chain.mineBlock([
      Tx.contractCall('nebulo', 'get-post', [
        postId
      ], wallet1.address)
    ]);
    
    let post = getPostBlock.receipts[0].result.expectOk().expectSome();
    assertEquals(post['tips'], types.uint(100));
  },
});

Clarinet.test({
  name: "Can follow and unfollow users",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    const wallet2 = accounts.get('wallet_2')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('nebulo', 'follow-user', [
        types.principal(wallet2.address)
      ], wallet1.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    let checkBlock = chain.mineBlock([
      Tx.contractCall('nebulo', 'is-following', [
        types.principal(wallet1.address),
        types.principal(wallet2.address)
      ], wallet1.address)
    ]);
    
    assertEquals(checkBlock.receipts[0].result, types.bool(true));
    
    let unfollowBlock = chain.mineBlock([
      Tx.contractCall('nebulo', 'unfollow-user', [
        types.principal(wallet2.address)
      ], wallet1.address)
    ]);
    
    unfollowBlock.receipts[0].result.expectOk().expectBool(true);
  },
});