// TODO: SignMessage
import { verify } from '@noble/ed25519';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import {Program, AnchorProvider, web3, utils, BN, setProvider} from "@coral-xyz/anchor";
import idl from "./shop_cart.json";
import {ShopCart} from "./shop_cart";
import { PublicKey } from '@solana/web3.js';
import { publicKey } from '@coral-xyz/anchor/dist/cjs/utils';
import { db } from "/home/faris/school-of-solana/7.lesson/firebase.js"
import { doc, getDoc, setDoc } from "firebase/firestore";

const idl_string = JSON.stringify(idl)
const idl_object = JSON.parse(idl_string)
const programID = new PublicKey(idl.address)

export const Vault: FC = () => {
    const ourWallet = useWallet();
    const {connection} = useConnection()
    const [vaults, setVaults] = useState([])

    const getProvider = () => {
        const provider = new AnchorProvider(connection, ourWallet, AnchorProvider.defaultOptions())
        setProvider(provider)
        return provider
    }
    let transactionHistoryPublicKey;

    const saveVaultToDatabase = async (vaultPublicKey, transactionHistoryPublicKey, sellerPublicKey) => {
        try {
          // Firestore document path (each seller can have one vault entry)
          const docRef = doc(db, "vaults", sellerPublicKey);
      
          // Add or update the vault data
          await setDoc(docRef, {
            vaultPublicKey: vaultPublicKey,
            transactionHistoryPublicKey: transactionHistoryPublicKey,
            sellerPublicKey: sellerPublicKey,
          });
      
          console.log("Vault data saved to Firestore!");
        } catch (error) {
          console.error("Error saving vault data:", error);
        }
      };

      const getVaultKeys = async (sellerPublicKey) => {
        // sellerPublicKey = "7xpjc66kFpFFSkqy7a84SzBTkMbcqvwQ7yS39oG9rxwU"
        try {
          const docRef = doc(db, "vaults", sellerPublicKey);
          const docSnap = await getDoc(docRef);
      
          if (docSnap.exists()) {
            const { vaultPublicKey, transactionHistoryPublicKey } = docSnap.data();
            const vaultDataJson = JSON.stringify({ vaultPublicKey, transactionHistoryPublicKey }, null, 2);
            console.log("Vault Data:", vaultDataJson);
            return { vaultPublicKey, transactionHistoryPublicKey };
          } else {
            console.log("No vault document found for this seller.");
            return null;
          }
        } catch (error) {
          console.error("Error retrieving vault data:", error);
          return null;
        }
      };
      

    const createVault = async () =>{
        try {
            const anchProvider = getProvider()
            const program = new Program<ShopCart>(idl_object, anchProvider)

            const [vaultPublicKey, vaultBump] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), anchProvider.publicKey.toBuffer()],
                program.programId
              );

            const [transactionHistoryPublicKey] = PublicKey.findProgramAddressSync(
            [Buffer.from("history"), vaultPublicKey.toBuffer()],
            program.programId
            );
            console.log("Transaction History PublicKey:", transactionHistoryPublicKey.toBase58());
            console.log("Vault PublicKey:", vaultPublicKey.toBase58());
            console.log("Provider PublicKey:", anchProvider.publicKey.toBase58());
            
              const txSignature = await program.methods.initializeVault(vaultBump, new BN(1000000000)).accountsStrict({
                vault: vaultPublicKey,
                transactionHistory: transactionHistoryPublicKey,
                seller: anchProvider.publicKey,
                systemProgram: web3.SystemProgram.programId,
              }).rpc();

              console.log("Vault created successfully. Transaction Signature:", txSignature);
              await saveVaultToDatabase(
                vaultPublicKey.toBase58(),
                transactionHistoryPublicKey.toBase58(),
                anchProvider.publicKey.toBase58()
              );
            
        } catch (error) {
            console.error("Error while creating the vault" + error)
        }
    }

    // const getVault = async () => {
    //     try {
    //         const anchProvider = getProvider()
    //         const program = new Program<ShopCart>(idl_object, anchProvider)
    //         Promise.all((await connection.getParsedProgramAccounts(programID)).map(async vault => ({
    //             ...(await program.account.vaultAccount.fetch(vault.pubkey)),
    //             pubkey: vault.pubkey
    //         }))).then(vaults => {
    //             console.log(vaults)
    //             setVaults(vaults)
    //         })
    //     } catch (error){
    //         console.error("Error while getting vault details" + error)
    //     }
    // }

    const getVault = async () => {
        try {
            const anchProvider = getProvider()
            const program = new Program<ShopCart>(idl_object, anchProvider)
    
            const parsedAccounts = await connection.getProgramAccounts(programID)
            
            const vaults = await Promise.all(parsedAccounts.map(async vault => {
                try {
                    const accountData = await program.account.vaultAccount.fetch(vault.pubkey);
                    return { ...accountData, pubkey: vault.pubkey };
                } catch (error) {
                    console.warn(`Skipping account due to invalid discriminator: ${vault.pubkey.toBase58()}`);
                    return null;
                }
            }));
    
            setVaults(vaults.filter(Boolean)); // Filter out nulls from failed fetch attempts
        } catch (error) {
            console.error("Error while getting vault details: " + error);
        }
    };
    

    const depositSol = async () =>{
        try {
            const anchProvider = getProvider()
            const program = new Program<ShopCart>(idl_object, anchProvider)

            const [vaultPublicKey, vaultBump] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), anchProvider.publicKey.toBuffer()],
                program.programId
              );

            const [transactionHistoryPublicKey] = PublicKey.findProgramAddressSync(
            [Buffer.from("history"), vaultPublicKey.toBuffer()],
            program.programId
            );

            const resultInit = await program.account.vaultAccount.fetch(vaultPublicKey);
            console.log(`Initial vault - balance: ${resultInit.balance}`);
            // console.log(`Initial vault - balance: ${vaultPublicKey}`);

            
            const txSignature = await program.methods.depositSol(new BN(1 * web3.LAMPORTS_PER_SOL)).accountsStrict({
                vault: vaultPublicKey,
                transactionHistory: transactionHistoryPublicKey,
                seller: anchProvider.publicKey,
                systemProgram: web3.SystemProgram.programId,
              }).rpc();

              
            //   console.log(`Initial vault - balance: ${vaultPublicKey}`);

              console.log("Sol added to vault. Transaction signature: ", txSignature)
              const resultAfter = await program.account.vaultAccount.fetch(vaultPublicKey);
              console.log(`after vault - balance: ${resultAfter.balance}`);

        } catch (error) {
            console.error("Error while deposit sol to vault" + error)
        }
    }

    const withdrawSol = async () =>{
        try {
            const anchProvider = getProvider()
            const program = new Program<ShopCart>(idl_object, anchProvider)

            const [vaultPublicKey, vaultBump] = PublicKey.findProgramAddressSync(
                [Buffer.from("vault"), anchProvider.publicKey.toBuffer()],
                program.programId
              );

            const [transactionHistoryPublicKey] = PublicKey.findProgramAddressSync(
            [Buffer.from("history"), vaultPublicKey.toBuffer()],
            program.programId
            );

            const resultInit = await program.account.vaultAccount.fetch(vaultPublicKey);
            const sellerBalanceBefore = await connection.getBalance(anchProvider.publicKey);
            console.log(`Initial vault - balance: ${resultInit.balance}`);
            console.log(`Vault account: ${vaultPublicKey}`);
            console.log(`Seller balance before withdrawal: ${sellerBalanceBefore / web3.LAMPORTS_PER_SOL} SOL`);
            
            const txSignature = await program.methods.withdrawSol(new BN(0.5 * web3.LAMPORTS_PER_SOL)).accountsStrict({
                vault: vaultPublicKey,
                transactionHistory: transactionHistoryPublicKey,
                seller: anchProvider.publicKey,
                systemProgram: web3.SystemProgram.programId,
              }).rpc();

              console.log("Sol withdraw from vault. Transaction signature: ", txSignature)
              const resultAfter = await program.account.vaultAccount.fetch(vaultPublicKey);
              const sellerBalanceAfter = await connection.getBalance(anchProvider.publicKey);
              console.log(`After vault - balance: ${resultAfter.balance}`);
              console.log(`Vault account: ${vaultPublicKey}`);
              console.log(`Seller account: ${anchProvider.publicKey}`);
              console.log(`Seller balance after withdrawal: ${sellerBalanceAfter / web3.LAMPORTS_PER_SOL} SOL`);
            

        } catch (error) {
            console.error("Error while deposit sol to vault" + error)
        }
    }

    const paySol = async () =>{
        try {
            const anchProvider = getProvider()
            const program = new Program<ShopCart>(idl_object, anchProvider)

                    // Fetch the vault keys from Firestore
            const sellerPublicKey = "7xpjc66kFpFFSkqy7a84SzBTkMbcqvwQ7yS39oG9rxwU"; // Use the buyer's public key or any specific seller's public key as the doc ID
            const vaultData = await getVaultKeys(sellerPublicKey);

            if (!vaultData) {
            console.log("Vault data not found for this seller.");
            return;
            }

            const { vaultPublicKey, transactionHistoryPublicKey } = vaultData;

            // Convert Firebase keys to PublicKey objects
            const vaultPublicKeyObj = new PublicKey(vaultPublicKey);
            const transactionHistoryPublicKeyObj = new PublicKey(transactionHistoryPublicKey);

            console.log(`vaultPublicKeyObj: ${vaultPublicKey}, transactionHistoryPublicKey: ${transactionHistoryPublicKey}`)
            
            const txSignature = await program.methods.paySol(new BN(0.5 * web3.LAMPORTS_PER_SOL)).accountsStrict({
                vault: vaultPublicKeyObj,
                transactionHistory: transactionHistoryPublicKeyObj,
                buyer: anchProvider.publicKey,
                systemProgram: web3.SystemProgram.programId,
              }).rpc();

              console.log("Buyer's Sol pay to vault. Transaction signature: ", txSignature)

              await new Promise((resolve) => setTimeout(resolve, 1000));
              
              const sellerBalanceAfter = await connection.getBalance(anchProvider.publicKey);
              const resultAfter = await program.account.vaultAccount.fetch(vaultPublicKeyObj);
              console.log(`After vault - balance: ${resultAfter.balance}, ${resultAfter.transactionHistory}`);
              console.log(`Vault account: ${vaultPublicKeyObj}`);
              console.log(`Seller account: ${anchProvider.publicKey}`);
              console.log(`Seller balance after withdrawal: ${sellerBalanceAfter / web3.LAMPORTS_PER_SOL} SOL`);
            

        } catch (error) {
            console.error("Error while deposit sol to vault" + error)
        }
    }

    const refundSol = async () =>{
        try {
            const anchProvider = getProvider()
            const program = new Program<ShopCart>(idl_object, anchProvider)

                    // Fetch the vault keys from Firestore
            const sellerPublicKey = "7xpjc66kFpFFSkqy7a84SzBTkMbcqvwQ7yS39oG9rxwU"; // Use the buyer's public key or any specific seller's public key as the doc ID
            const vaultData = await getVaultKeys(sellerPublicKey);

            if (!vaultData) {
            console.log("Vault data not found for this seller.");
            return;
            }

            const { vaultPublicKey, transactionHistoryPublicKey } = vaultData;

            // Convert Firebase keys to PublicKey objects
            const vaultPublicKeyObj = new PublicKey(vaultPublicKey);
            const transactionHistoryPublicKeyObj = new PublicKey(transactionHistoryPublicKey);
            
            const txSignature = await program.methods.refundSol(new BN(0.5 * web3.LAMPORTS_PER_SOL)).accountsStrict({
                vault: vaultPublicKeyObj,
                transactionHistory: transactionHistoryPublicKeyObj,
                buyer: anchProvider.publicKey,
                systemProgram: web3.SystemProgram.programId,
              }).rpc();

              console.log("Buyer's Sol refund from vault. Transaction signature: ", txSignature)
              const resultAfter = await program.account.vaultAccount.fetch(vaultPublicKeyObj);
              const sellerBalanceAfter = await connection.getBalance(anchProvider.publicKey);
              console.log(`After vault - balance: ${resultAfter.balance}`);
              console.log(`Vault account: ${vaultPublicKeyObj}`);
              console.log(`Seller account: ${anchProvider.publicKey}`);
              console.log(`Seller balance after withdrawal: ${sellerBalanceAfter / web3.LAMPORTS_PER_SOL} SOL`);
            

        } catch (error) {
            console.error("Error while deposit sol to vault" + error)
        }
    }

    return (
        <div>
            {
                vaults.map((vault) => {
                    return (
                        <div className='md:hero-content flex flex-col'>
                            <h1>{vault.name.toString()}</h1>
                            <span>{vault.balance.toString()}</span>
                            <button
                                className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                                onClick={() => depositSol()}>
                                <span>
                                    Deposit 0.1
                                </span>
                            </button>
                        </div>
                    )
                })
            }

        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={ourWallet.connected ? createVault : undefined}
                    disabled={!ourWallet.connected}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        Create Vault
                    </span>
                </button>
                {/* <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={ourWallet.connected ? getVault : undefined}
                    disabled={!ourWallet.connected}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        Fetch Vault
                    </span>
                </button> */}

                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={ourWallet.connected ? depositSol : undefined}
                    disabled={!ourWallet.connected}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        deposit sol to Vault
                    </span>
                </button>

                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={ourWallet.connected ? withdrawSol : undefined}
                    disabled={!ourWallet.connected}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        withdraw sol from Vault
                    </span>
                </button>
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={ourWallet.connected ? paySol : undefined}
                    disabled={!ourWallet.connected}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        PaySol from buyer to vault
                    </span>
                </button>
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={ourWallet.connected ? refundSol : undefined}
                    disabled={!ourWallet.connected}
                >
                    <div className="hidden group-disabled:block">
                        Wallet not connected
                    </div>
                    <span className="block group-disabled:hidden" > 
                        Refund sol from vault to buyer
                    </span>
                </button>
            </div>
        </div>
        </div>
    );
};
