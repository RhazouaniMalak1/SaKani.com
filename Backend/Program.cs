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
// using Projet1.Hubs; // <<< COMMENTÉ : Plus besoin si on n'utilise plus le Hub
using System.Threading.Tasks; // Gardé pour Task.CompletedTask


// --- BUILDER SETUP ---
var builder = WebApplication.CreateBuilder(args);

// --- SERVICES CONFIGURATION ---

// 1. Controllers & JSON Options
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.WriteIndented = builder.Environment.IsDevelopment();
});

// 2. DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.MigrationsAssembly(typeof(Program).Assembly.FullName)
    ));

// 3. Identity Configuration
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();


// 4. CORS Configuration (Inchangé, requis pour l'API)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontendApp", policyBuilder =>
    {
        policyBuilder.WithOrigins("http://localhost:3000")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials(); // Garder pour autres appels API si besoin
    });
});

// 5. JWT Configuration (Inchangé)
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));

// --- COMMENTÉ : Service SignalR ---
// builder.Services.AddSignalR(); // <<< COMMENTÉ
// --- FIN COMMENTAIRE ---


// Configuration de l'authentification JWT
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();

    var jwtKey = builder.Configuration["Jwt:Key"];
    var issuer = builder.Configuration["Jwt:Issuer"];
    var audience = builder.Configuration["Jwt:Audience"];

    if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(issuer) || string.IsNullOrEmpty(audience))
    {
        throw new InvalidOperationException("Configuration JWT (Key, Issuer, Audience) manquante pour l'authentification.");
    }

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };

    // --- COMMENTÉ : Événements JWT pour SignalR ---
    // Cette section n'est plus nécessaire si SignalR n'est pas utilisé pour le chat.
    /*
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/chatHub")))
            {
                context.Token = accessToken;
                Console.WriteLine($"[JwtBearerEvents OnMessageReceived] Token récupéré de la query string pour {path} (Ignoré car SignalR désactivé).");
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            Console.WriteLine($"[JwtBearerEvents OnAuthenticationFailed] Échec d'authentification JWT: {context.Exception?.GetType().Name} - {context.Exception?.Message}");
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            Console.WriteLine($"[JwtBearerEvents OnTokenValidated] Token JWT validé pour l'utilisateur: {context.Principal?.Identity?.Name ?? "Inconnu"}");
            return Task.CompletedTask;
        }
    };
    */
    // --- FIN COMMENTAIRE ---
});

// 6. Authorization (Inchangé)
builder.Services.AddAuthorization();

// 7. Swagger/OpenAPI Configuration (Inchangé)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Projet1 API", Version = "v1" });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Entrez 'Bearer [espace] et ensuite votre token JWT.'\n\nExemple: \"Bearer 12345abcdef\"",
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });

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
            new string[] {}
        }
    });
});


// --- APPLICATION BUILD ---
var app = builder.Build();

// --- MIDDLEWARE PIPELINE CONFIGURATION ---

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Projet1 API v1"));
}
else
{
    app.UseHsts();
}

// app.UseHttpsRedirection();

app.UseRouting(); // Avant CORS/Auth

app.UseCors("AllowFrontendApp"); // Appliquer CORS

app.UseAuthentication(); // AVANT UseAuthorization
app.UseAuthorization();  // APRÈS UseAuthentication

app.MapControllers(); // Mappe les contrôleurs API

// --- COMMENTÉ : Mappage du Hub SignalR ---
// app.MapHub<ChatHub>("/chatHub"); // <<< COMMENTÉ
// --- FIN COMMENTAIRE ---


// --- INITIALISATION (Rôles) (Inchangé) ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var roles = new[] {  "Vendeur","Admin", "Client" };

        logger.LogInformation("Vérification/Création des rôles...");
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole(roleName));
                if (roleResult.Succeeded) { logger.LogInformation($"Rôle '{roleName}' créé."); }
                else { logger.LogError($"Erreur création rôle '{roleName}': {string.Join(", ", roleResult.Errors.Select(e => e.Description))}"); }
            } else { logger.LogInformation($"Rôle '{roleName}' existe déjà."); }
        }
        logger.LogInformation("Initialisation des rôles terminée.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Erreur lors de l'initialisation des rôles au démarrage.");
    }
}

app.UseDefaultFiles(); // <-- Pour Hebergement------------------------------------------------
app.UseStaticFiles(); // Pour wwwroot

// Servir les fichiers depuis Uploads (Inchangé)
var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
if (!Directory.Exists(uploadPath)) { Directory.CreateDirectory(uploadPath); }
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadPath),
    RequestPath = "/Uploads"
});

// --- RUN APP ---
app.Run();