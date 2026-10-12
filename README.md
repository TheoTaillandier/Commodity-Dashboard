# Commodity Cockpit

**[Télécharger le dashboard HTML](https://github.com/TheoTaillandier/Test2/raw/refs/heads/main/index.html)** — enregistrer `index.html`, puis l’ouvrir dans Chrome ou Edge. Le fichier s’ouvre seul ; aucun serveur ni installation n’est nécessaire pour le consulter.

## Lire le cockpit

- **Marchés** : cinq cotations indicatives TradingView/OANDA, graphique à gauche, trois prochaines publications, repères physiques datés, gaz et GNL. Le bouton **Historique publié** ouvre les séries embarquées même lorsque les widgets sont bloqués par le réseau.
- **Physique** : trois faits à comprendre, graphiques avec unités et échelles, comparaison annuelle, tableau des mesures et commentaire concis. Pétrole, gaz, agriculture et métaux restent séparés.
- **Power FR** : prix day-ahead du créneau livré, aujourd’hui/demain, écart France/DE-LU, historique annuel, facteurs physiques RTE et prévision de demande ENTSO-E. Un prix day-ahead est fixé la veille, distinct d’une cotation intraday.

Le HTML contient un instantané daté. À l’ouverture et via **Rafraîchir**, il tente de récupérer les JSON publiés sur GitHub. Les widgets suivent leur cadence de fournisseur. Les prix Power sont vérifiés toutes les 30 minutes ; les observations RTE toutes les 15 minutes quand Power est visible. Un accès refusé conserve la dernière donnée datée.

## Développement

La consultation reste un fichier unique, mais les sources sont maintenant séparées :

| Fichier | Rôle |
|---|---|
| `app/template.html` | Structure des trois pages |
| `app/styles.css` | Présentation commune et adaptations mobile |
| `app/cockpit.js` | Graphiques SVG, interactions, contrôles et lectures directes |
| `scripts/update_data.py` | Collecte et validation des publications |
| `scripts/build_dashboard.py` | Génération du HTML autonome |
| `data/*.json` | Observations, provenance et historiques |

```bash
python -m unittest discover -s tests -v
python scripts/build_dashboard.py
```

Pour modifier la présentation, éditer `app/`, puis reconstruire `index.html`. Ne pas coller ce README dans Bloc-notes : **le code ouvrable est `index.html`**. Le workflow reconstruit également le fichier à chaque modification des sources.

Les captures et contrôles desktop/mobile se trouvent dans les artefacts de [Vérifier l’interface du cockpit](https://github.com/TheoTaillandier/Test2/actions/workflows/validate-ui.yml). Les tests navigateur utilisent les vraies données embarquées et le mode hors connexion ; ils vérifient navigation, tableaux, graphiques annuels, export et absence de débordement.

## Collecte et accès

GitHub Actions collecte toutes les deux heures, avec possibilité de retard côté GitHub. `GIE_API_KEY` et `ENTSOE_API_TOKEN` restent dans **Settings → Secrets and variables → Actions**. Aucun jeton ne figure dans le HTML. RTE et les prix day-ahead Energy-Charts fonctionnent sans nouvelle clé.

EEX expose des fichiers NGP téléchargeables mais la republication automatique est soumise à ses droits de données. La collecte NGP est donc désactivée par défaut. La variable Actions `EEX_NGP_REDISTRIBUTION_ALLOWED=true` est réservée à un droit de redistribution obtenu séparément ; elle ne donne pas ce droit. Sans cela, le TTF affiche le repère mensuel Banque mondiale/BCE, explicitement daté. PEG, JKM et ID1/ID3 restent signalés comme flux non connectés.

[Sources, unités et calculs](methodology.md) · [Registre des sources](docs/source-register.md) · [Journal de maintenance](docs/agent-journal.md)
