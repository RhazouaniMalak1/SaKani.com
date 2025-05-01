// Dans Controllers/AccountController.cs

// --- Using Statements ---
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http; // Ajouté pour StatusCodes
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Projet1.Models;
using Projet1.Utilities;
using Projet1.Dtos; // <= Changé de ViewModels à DTOs
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Projet1.Controllers // Assurez-vous que le namespace est correct
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;

        public AccountController(
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager,
            SignInManager<User> signInManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _signInManager = signInManager;
            _configuration = configuration;
        }

        // POST /api/account/register
        [HttpPost("register")]
        [AllowAnonymous]
        // Utilise RegisterDto du namespace Projet1.DTOs
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                ModelState.AddModelError(nameof(dto.Email), "Cette adresse email est déjà utilisée.");
                return BadRequest(ModelState);
            }

            var user = new User // Mapper depuis le DTO vers le Modèle
            {
                UserName = dto.Email,
                Email = dto.Email,
                Nom = dto.Nom,
                Prenom = dto.Prenom,
                EmailConfirmed = true // Simplifié pour l'instant
            };

            var result = await _userManager.CreateAsync(user, dto.Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors) { ModelState.AddModelError(string.Empty, error.Description); }
                return BadRequest(ModelState);
            }

            // --- Assignation du rôle ---
            string roleName = dto.UserType.ToString();
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                Console.Error.WriteLine($"ERREUR CONFIG: Le rôle '{roleName}' n'existe pas.");
                await _userManager.DeleteAsync(user); // Nettoyage
                ModelState.AddModelError(nameof(dto.UserType), $"Le rôle système '{roleName}' n'est pas configuré.");
                return StatusCode(StatusCodes.Status500InternalServerError, ModelState);
            }

            var roleResult = await _userManager.AddToRoleAsync(user, roleName);
            if (!roleResult.Succeeded)
            {
                 Console.Error.WriteLine($"ERREUR: Impossible d'assigner rôle '{roleName}' à {user.Email}.");
                 foreach (var error in roleResult.Errors) { ModelState.AddModelError(string.Empty, error.Description); }
                 await _userManager.DeleteAsync(user); // Nettoyage
                 return StatusCode(StatusCodes.Status500InternalServerError, ModelState);
            }
            // --------------------------

            // Optionnel : Retourner les infos de l'utilisateur créé (via DTO) ?
            // Pour l'instant, simple message de succès.
            // On pourrait créer un RegisterResponseDto ou retourner UserInfoDto ici.
            return Ok(new { Message = "Utilisateur enregistré avec succès.", UserId = user.Id });
        }

        // POST /api/account/login
        [HttpPost("login")]
        [AllowAnonymous]
        // Utilise LoginDto du namespace Projet1.DTOs
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);
            // Combinez la vérification null et mot de passe pour éviter l'énumération d'utilisateurs
            if (user == null)
            {
                 // Toujours vérifier le mot de passe même si l'utilisateur n'existe pas
                 // pour rendre le temps de réponse similaire et éviter les attaques temporelles.
                 // On peut utiliser un hash par défaut si user est null.
                 // Cependant, pour simplifier ici, on retourne direct.
                 return Unauthorized(new { Message = "Identifiants invalides." });
            }

             // Vérifier le verrouillage AVANT CheckPasswordSignInAsync si possible
            if (await _userManager.IsLockedOutAsync(user))
            {
                 return StatusCode(StatusCodes.Status423Locked, new { Message = "Compte temporairement verrouillé." });
            }

            // CheckPasswordSignInAsync gère le lockoutOnFailure
            var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);

            if (result.Succeeded)
            {
                await _userManager.ResetAccessFailedCountAsync(user); // Réinitialiser les échecs
                var token = await JwtUtils.GenerateJwtTokenAsync(user, _configuration, _userManager);

                // Optionnel : Créer un LoginResponseDto contenant le token et peut-être UserInfoDto ?
                return Ok(new { Token = token, Message = "Connexion réussie." });
            }

            if (result.IsLockedOut)
            {
                 return StatusCode(StatusCodes.Status423Locked, new { Message = "Compte verrouillé suite à trop de tentatives." });
            }
            // if (result.IsNotAllowed) { /* Gérer email non confirmé */ }

            return Unauthorized(new { Message = "Identifiants invalides." }); // Unauthorized (401) est plus approprié que BadRequest (400) ici
        }

        // POST /api/account/logout
        [HttpPost("logout")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> Logout()
        {
            // Pas grand chose à faire côté serveur pour JWT à part peut-être logger l'action
            await _signInManager.SignOutAsync(); // Efface le cookie si utilisé
            return Ok(new { Message = "Déconnexion demandée. Le client doit supprimer le token." });
        }

        // GET /api/account/user-info
        [HttpGet("user-info")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        // Retourne le UserInfoDto
        public async Task<ActionResult<UserInfoDto>> GetUserInfo() // Type de retour explicite
        {
             var user = await _userManager.GetUserAsync(User); // Le 'User' ici est le ClaimsPrincipal
             if (user == null)
             {
                 // Devrait être rare si le token est valide, mais possible si l'utilisateur a été supprimé
                 return Unauthorized(new { Message = "Utilisateur associé au token introuvable." });
             }

             var roles = await _userManager.GetRolesAsync(user);

             // Mapper l'entité User vers UserInfoDto
             var userInfoDto = new UserInfoDto
             {
                 Id = user.Id,
                 UserName = user.UserName,
                 Email = user.Email,
                 Nom = user.Nom,
                 Prenom = user.Prenom,
                 Roles = roles // roles est déjà IList<string>
             };

             return Ok(userInfoDto); // Retourne le DTO peuplé
        }
    }
}