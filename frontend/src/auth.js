import Keycloak from "keycloak-js";

const config = window.APP_CONFIG;

const keycloak = new Keycloak({
  url: config.KEYCLOAK_URL,
  realm: config.KEYCLOAK_REALM,
  clientId: config.KEYCLOAK_CLIENT_ID,
});

export async function initAuth() {
  const authenticated = await keycloak.init({
    onLoad: "login-required",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });

  if (!authenticated) {
    await keycloak.login();
  }

  setInterval(() => {
    keycloak.updateToken(60).catch(() => keycloak.login());
  }, 30000);

  return keycloak;
}

export default keycloak;
