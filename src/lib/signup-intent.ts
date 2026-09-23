/**
 * Intention choisie à l'inscription : « Je suis prestataire ».
 *
 * Gardée sur l'appareil (AsyncStorage) le temps que le compte existe et que la
 * demande d'adhésion soit envoyée : ensuite, c'est la ligne provider_applications
 * qui fait foi (profile-store). Effacée à la déconnexion. Lecture/écriture
 * tolérantes aux erreurs : sans stockage, le compte retombe simplement en client.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'tocato-signup-intent';

export async function setProviderIntent(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'provider');
  } catch {
    // Stockage indisponible : l'intention est perdue, le compte sera client.
  }
}

export async function clearProviderIntent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // Rien à effacer.
  }
}

export async function hasProviderIntent(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'provider';
  } catch {
    return false;
  }
}
