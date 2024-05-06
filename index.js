import * as ZOHOCRMSDK from "@zohocrm/nodejs-sdk-6.0";
import axios from "axios";
import client from "./self_client.json" assert { type: "json" };

class CatBreeds {
  // Fonction pour initialiser l'API Zoho CRM
  static async initialize(access_token) {
    let environment = ZOHOCRMSDK.USDataCenter.PRODUCTION();
    let token = new ZOHOCRMSDK.OAuthBuilder()
      .clientId(client.client_id)
      .clientSecret(client.client_secret)
      .refreshToken(access_token)
      .build();
    await (await new ZOHOCRMSDK.InitializeBuilder())
      .environment(environment)
      .token(token)
      .initialize();
  }

  // Fonction pour rafraîchir le token d'accès
  static async refreshAccessToken(clientId, clientSecret, refreshToken) {
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "authorization_code",
      // grant_type: 'refresh_token'
    });

    try {
      const response = await axios.post(
        "https://accounts.zoho.com/oauth/v2/token",
        params
      );
      return response.data.access_token;
    } catch (error) {
      console.error(
        "Error refreshing access token:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }

  // Récupérer les races de chats avec origine "Natural"
  static async fetchNaturalCatBreeds() {
    try {
      const response = await axios.get("https://catfact.ninja/breeds");
      const breeds = response.data.data.filter(
        (breed) => breed.origin === "Natural"
      );
      return breeds;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des races de chats:",
        error
      );
      return [];
    }
  }

  // Fonction pour créer un contact dans Zoho CRM
  static async createContact(breed) {
    let recordArray = [];

    let record = new ZOHOCRMSDK.Record.Record();
    record.addFieldValue(
      ZOHOCRMSDK.Record.Field.Contacts.FIRST_NAME,
      breed.breed
    );
    record.addFieldValue(
      ZOHOCRMSDK.Record.Field.Contacts.LAST_NAME,
      breed.breed
    );
    record.addFieldValue(
      ZOHOCRMSDK.Record.Field.Contacts.EMAIL,
      `${breed.breed.replace(/ /g, "_")}@gmail.com`
    );

    recordArray.push(record);

    const recordOperations = new ZOHOCRMSDK.Record.Operations();
    const response = await recordOperations.upsertRecords(
      recordArray,
      "Contacts"
    );
    return response;
  }
}

// Fonction principale pour synchroniser les races de chats vers Zoho CRM
const main = async () => {
  const access_token = await CatBreeds.refreshAccessToken(
    client.client_id,
    client.client_secret,
    client.code
  );
  await CatBreeds.initialize(access_token);
  const breeds = await CatBreeds.fetchNaturalCatBreeds();
  await Promise.all(breeds.map((breed) => CatBreeds.createContact(breed)));
};

main();
