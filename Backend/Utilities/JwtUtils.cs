// Ajoutez les using nécessaires en haut
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Projet1.Models; // Pour accéder à la classe User et ses props Nom/Prenom
using System;
using System.Collections.Generic; // Pour List<Claim>
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Projet1.Utilities // Assurez-vous que le namespace est correct
{
    public static class JwtUtils // Classe statique car méthode statique
    {
        // Méthode pour générer le token, basée sur votre exemple
        public static async Task<string> GenerateJwtTokenAsync(User user, IConfiguration configuration, UserManager<User> userManager)
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            // Lire la configuration JWT depuis IConfiguration
            // !! Assurez-vous que les clés existent dans appsettings.json !!
            var jwtKey = configuration["Jwt:Key"];
            var issuer = configuration["Jwt:Issuer"];
            var audience = configuration["Jwt:Audience"];

            // Vérification minimale (une gestion d'erreur plus robuste serait mieux en production)
            if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(issuer) || string.IsNullOrEmpty(audience))
            {
                throw new InvalidOperationException("La configuration JWT (Key, Issuer, Audience) est manquante ou incomplète dans appsettings.json.");
            }
            var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

            // Récupérer les rôles de l'utilisateur
            var roles = await userManager.GetRolesAsync(user);

            // Créer la liste des claims (informations dans le token)
            var claims = new List<Claim>
            {
                // Identifiant unique de l'utilisateur (standard)
                new Claim(JwtRegisteredClaimNames.Sub, user.Id), // Utiliser les noms standards si possible (Sub = Subject)
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // Identifiant unique du token lui-même (recommandé)
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty), // Email (standard)
                new Claim(ClaimTypes.NameIdentifier, user.Id), // Autre façon d'identifier l'utilisateur
                // --- Claims personnalisés ---
                new Claim("uid", user.Id), // Répète l'ID si certains systèmes le cherchent sous "uid"
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty), // Nom d'utilisateur (par défaut, souvent l'email)
                // Ajout de vos champs personnalisés (adaptez les noms de claim si vous avez des conventions)
                new Claim("lastname", user.Nom ?? string.Empty),    // Nom de famille
                new Claim("firstname", user.Prenom ?? string.Empty) // Prénom
                // Anciens ClaimTypes (peuvent être redondants avec les customs ci-dessus)
                // new Claim(ClaimTypes.GivenName, user.Prenom ?? string.Empty),
            };

            // Ajouter les rôles aux claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
                // ou claims.Add(new Claim("role", role)); si vous préférez
            }

            // Lire la durée d'expiration depuis la config (ou utiliser une valeur par défaut)
            // Tentative de lire ExpiryMinutes depuis la section Jwt
            var expiryMinutesStr = configuration["Jwt:ExpiryMinutes"];
            int expiryMinutes = int.TryParse(expiryMinutesStr, out int minutes) ? minutes : 60; // Défaut 60 minutes

            // Décrire le token
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(expiryMinutes), // Utilise la durée lue ou par défaut
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256Signature)
            };

            // Créer et écrire le token
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}