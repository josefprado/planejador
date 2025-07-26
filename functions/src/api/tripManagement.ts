import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { corsOptions } from "../config";

const db = admin.firestore();

export const deleteTripCascade = onCall({ ...corsOptions }, async (request) => {
  const uid = request.auth?.uid;
  const { tripId } = request.data;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Você precisa estar logado para realizar esta ação.");
  }
  if (!tripId) {
    throw new HttpsError("invalid-argument", "O ID da viagem é obrigatório.");
  }

  const tripRef = db.collection("trips").doc(tripId);
  try {
    const tripDoc = await tripRef.get();
    if (!tripDoc.exists) {
      throw new HttpsError("not-found", "A viagem não foi encontrada.");
    }
    const tripData = tripDoc.data();
    if (tripData?.ownerId !== uid) {
      throw new HttpsError("permission-denied", "Você não tem permissão para apagar esta viagem.");
    }
    await db.recursiveDelete(tripRef);
    return { success: true, message: "Viagem apagada com sucesso." };
  } catch (error) {
    console.error(`Error deleting trip ${tripId} for user ${uid}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Ocorreu um erro inesperado ao apagar a viagem.");
  }
});