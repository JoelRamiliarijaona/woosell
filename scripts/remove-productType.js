// Script pour supprimer la colonne productType de la collection sites
db.sites.updateMany(
  {},
  { $unset: { productType: "" } }
);
