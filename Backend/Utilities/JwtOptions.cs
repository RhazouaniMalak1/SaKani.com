namespace Projet1.Utilities // Assurez-vous que le namespace est correct
{
    public class JwtOptions
    {
        // Ces noms doivent correspondre aux clés dans appsettings.json -> Jwt
        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        // Note: Votre exemple original avait aussi ExpiryMinutes, vous pouvez l'ajouter ici
        // si vous voulez le lire depuis la configuration.
        // public int ExpiryMinutes { get; set; } = 60; // Exemple : 60 minutes par défaut
    }
}