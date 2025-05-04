// --- USING STATEMENTS ---
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Projet1.Data;     // Pour ApplicationDbContext
using Projet1.Models;     // Pour User
using Projet1.Utilities;  // Pour JwtOptions (si vous l'utilisez pour la configuration)
using System.Text;
using System.Text.Json.Serialization;
// Nécessaire pour Path.Combine et PhysicalFileProvider
using Microsoft.Extensions.FileProviders;
using System.IO;


// --- BUILDER SETUP ---
var builder = WebApplication.CreateBuilder(args);

// --- SERVICES CONFIGURATION ---

// 1. Controllers & JSON Options
builder.Services.AddControllers().AddJsonOptions(options =>
{
    // Gère les cycles dans les objets retournés (utile avec EF Core)
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.WriteIndented = builder.Environment.IsDevelopment(); // Indentation en dev
});

// 2. DbContext (Minimal pour Identity pour l'instant)
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        // Optionnel: Spécifier l'assembly pour les migrations si elles sont dans un autre projet
        sqlOptions => sqlOptions.MigrationsAssembly(typeof(Program).Assembly.FullName)
    ));

// 3. Identity Configuration
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    // Options de mot de passe (à ajuster selon votre politique)
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;

    // Autres options utiles à considérer :
    // options.SignIn.RequireConfirmedAccount = true; // Nécessite confirmation email
    // options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    // options.Lockout.MaxFailedAccessAttempts = 5;
    // options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>() // Lie Identity à EF Core et notre DbContext
.AddDefaultTokenProviders(); // Pour générer les tokens de confirmation email, reset password etc.

// 4. CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendApp", policyBuilder => // Nom de politique plus spécifique
    {
        // !! Mettez l'URL de votre frontend ici !!
        // Vous pouvez lire depuis la config: builder.Configuration["FrontendUrl"] ?? "http://localhost:3000"
        policyBuilder.WithOrigins("http://localhost:3000")
               .AllowAnyHeader()
               .AllowAnyMethod();
               // .AllowCredentials(); // Décommentez si besoin (requêtes avec cookies/auth session)
    });
});

// 5. JWT Configuration
// Lier la section "Jwt" à la classe JwtOptions (bonne pratique même si JwtUtils ne l'utilise pas directement)
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

// Configuration de l'authentification JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true; // Garde le token accessible après validation
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment(); // Exiger HTTPS sauf en dev

    // Lire la configuration JWT depuis IConfiguration (comme dans JwtUtils)
    var jwtKey = builder.Configuration["Jwt:Key"];
    var issuer = builder.Configuration["Jwt:Issuer"];
    var audience = builder.Configuration["Jwt:Audience"];

    // Vérification minimale
    if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(issuer) || string.IsNullOrEmpty(audience))
    {
        throw new InvalidOperationException("Configuration JWT (Key, Issuer, Audience) manquante pour l'authentification.");
    }

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true, // Vérifier l'expiration
        ValidateIssuerSigningKey = true, // Vérifier la signature avec la clé
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero // Ne pas tolérer de décalage horaire pour l'expiration
    };
});

// 6. Authorization
builder.Services.AddAuthorization(); // Active les mécanismes d'autorisation ([Authorize])

// 7. Swagger/OpenAPI Configuration
builder.Services.AddEndpointsApiExplorer(); // Nécessaire pour les minimal APIs et Swagger
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Projet1 API", Version = "v1" });

    // Ajouter la définition de sécurité pour JWT Bearer
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Entrez 'Bearer [espace] et ensuite votre token JWT.'\n\nExemple: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http, // Ou ApiKey si vous préférez
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });

    // Exiger globalement l'authentification pour les endpoints (sauf si [AllowAnonymous])
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {} // Ou spécifier des scopes si vous en utilisez
        }
    });
});


// --- APPLICATION BUILD ---
var app = builder.Build();

// --- MIDDLEWARE PIPELINE CONFIGURATION (L'ORDRE EST IMPORTANT) ---

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); // Page d'erreur détaillée en dev
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Projet1 API v1"));
}
else
{
    // Ajouter gestion d'erreur pour la prod ici (ex: UseExceptionHandler("/Error"))
    app.UseHsts(); // Forcer HTTPS en prod (si configuré)
}

// Middleware pour la redirection HTTPS (recommandé en prod)
// app.UseHttpsRedirection();

// Middleware pour le routage
app.UseRouting(); // Doit être avant CORS et Auth

// Middleware CORS (doit être avant Auth et MapControllers)
app.UseCors("AllowFrontendApp"); // Utilise la policy définie plus haut

// Middleware d'authentification (identifie l'utilisateur via le token)
app.UseAuthentication(); // <<< TRES IMPORTANT : AVANT UseAuthorization

// Middleware d'autorisation (vérifie les permissions/rôles)
app.UseAuthorization(); // <<< TRES IMPORTANT : APRES UseAuthentication

// Mappe les requêtes aux actions des contrôleurs
app.MapControllers();


// --- INITIALISATION (ex: Rôles) ---
// Utiliser un scope pour accéder aux services après la construction de l'app
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var roles = new[] {  "Vendeur","Admin", "Client" }; // Vos rôles applicatifs

        logger.LogInformation("Vérification/Création des rôles...");
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole(roleName));
                if (roleResult.Succeeded) {
                    logger.LogInformation($"Rôle '{roleName}' créé.");
                } else {
                    logger.LogError($"Erreur création rôle '{roleName}': {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                }
            } else {
                logger.LogInformation($"Rôle '{roleName}' existe déjà.");
            }
        }
        logger.LogInformation("Initialisation des rôles terminée.");

        // Optionnel: Créer un utilisateur admin par défaut si besoin (comme dans votre exemple)
        // var userManager = services.GetRequiredService<UserManager<User>>();
        // ... logique de création admin ...

    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erreur lors de l'initialisation des rôles au démarrage.");
        // Vous pourriez vouloir arrêter l'appli ici si les rôles sont critiques
    }
}


app.UseStaticFiles();

// Servir les fichiers depuis le dossier Uploads sous l'URL /Uploads
var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
if (!Directory.Exists(uploadPath)) // Crée le dossier s'il n'existe pas
{
    Directory.CreateDirectory(uploadPath);
}
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadPath),
    RequestPath = "/Uploads" // L'URL pour accéder aux fichiers sera http://.../Uploads/nom_fichier.jpg
});

// --- RUN APP ---
app.Run();