/* Pages juridiques (mentions légales, CGV, confidentialité), FR + EN.
   Les infos de l'éditeur viennent de lib/legal.ts. L'anglais est typé sur le français (LegalDict). */
import type { Lang } from "./index";
import { LEGAL as L, RETENTION } from "../legal";

export type LegalDoc = { title: string; lead?: string; sections: { h: string; p: string[] }[] };
export type LegalDict = { updated: (d: string) => string; mentions: LegalDoc; cgv: LegalDoc; privacy: LegalDoc };

const months = Math.round(RETENTION.afterEventDays / 30);
const draftMonths = Math.round(RETENTION.draftDays / 30);

const HOSTS = {
  cloudflare: "Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, USA (cloudflare.com)",
  supabase: "Supabase, Inc., 970 Toa Payoh North #07-04, Singapore 318992 (supabase.com)",
  brevo: "Sendinblue SAS (Brevo), 106 boulevard Haussmann, 75008 Paris, France (brevo.com)",
  stripe: "Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irlande (stripe.com)",
};

const fr: LegalDict = {
  updated: (d) => `Dernière mise à jour : ${new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`,
  mentions: {
    title: "Mentions légales",
    sections: [
      { h: "Éditeur du site", p: [
        `Le site ${L.site} est édité par ${L.owner}, entrepreneur individuel (EI), exerçant sous le nom commercial « ${L.brand} ».`,
        `SIREN : ${L.siren}.`,
        `Adresse : ${L.address} (domiciliation : ${L.domiciliation}).`,
        `Contact : ${L.email}.`,
        L.vatFranchise ? "TVA non applicable, art. 293 B du CGI." : "",
      ].filter(Boolean) },
      { h: "Directeur de la publication", p: [`${L.owner}.`] },
      { h: "Hébergement", p: [
        `Site hébergé par ${HOSTS.cloudflare}.`,
        `Données et photos stockées par ${HOSTS.supabase}.`,
      ] },
      { h: "Propriété intellectuelle", p: [
        `Les modèles d'invitation, animations, illustrations, textes et le logo ${L.brand} sont protégés. Toute reproduction sans autorisation est interdite.`,
        "Les textes et photos ajoutés par les mariés restent leur propriété ; ils en garantissent les droits (voir les CGV).",
      ] },
      { h: "Signaler un contenu", p: [`Pour signaler une invitation au contenu illicite, écrivez à ${L.email} en indiquant son lien.`] },
    ],
  },
  cgv: {
    title: "Conditions générales de vente",
    lead: `Les présentes conditions s'appliquent à toute utilisation du service ${L.brand} et à tout achat sur ${L.site}. Publier une invitation vaut acceptation de ces conditions.`,
    sections: [
      { h: "1. Vendeur", p: [`${L.owner}, EI (« ${L.brand} »), SIREN ${L.siren}, ${L.address}. Contact : ${L.email}.`] },
      { h: "2. Service", p: [
        `${L.brand} permet de créer une invitation animée en ligne (mariage et autres événements), de l'envoyer par un lien privé et de recueillir les réponses des invités dans un espace personnel.`,
        "La création, l'aperçu et l'enregistrement d'une invitation sont gratuits. Seule la publication est payante, lorsque le paiement est indiqué dans l'éditeur.",
      ] },
      { h: "3. Prix", p: [
        `Le prix est affiché dans l'éditeur avant toute commande, en euros, paiement unique par invitation${L.vatFranchise ? " ; TVA non applicable, art. 293 B du CGI" : ""}.`,
        "Il comprend : la publication de l'invitation, un nombre illimité d'invités et de réponses, les modifications illimitées et la mise en ligne jusqu'à 3 mois après la date de l'événement. Une invitation déjà publiée ne se paie pas une seconde fois.",
        "Le prix affiché au moment de la publication est celui qui s'applique.",
      ] },
      { h: "4. Commande et paiement", p: [
        "La commande est passée en cliquant sur le bouton de publication payante, après acceptation des présentes conditions. Le paiement se fait par carte bancaire sur la page sécurisée de Stripe ; nous n'avons jamais accès à vos coordonnées bancaires.",
        "L'invitation est publiée dès la confirmation du paiement. Un e-mail de confirmation contenant le lien de l'invitation et celui de votre espace vous est envoyé.",
      ] },
      { h: "5. Droit de rétractation", p: [
        "Le service est un contenu numérique fourni immédiatement après le paiement. Conformément à l'article L221-28 13° du Code de la consommation, en cochant la case prévue avant le paiement, vous demandez l'exécution immédiate du service et renoncez expressément à votre droit de rétractation.",
        `En cas de problème technique empêchant l'utilisation de votre invitation, écrivez-nous à ${L.email} : nous chercherons une solution ou vous rembourserons.`,
      ] },
      { h: "6. Vos contenus", p: [
        "Vous restez propriétaire des textes et photos que vous ajoutez. Vous garantissez en avoir les droits (notamment le droit à l'image des personnes photographiées) et qu'ils ne sont ni illicites, ni injurieux, ni contraires aux droits d'autrui.",
        `Vous nous autorisez à les héberger et à les afficher à toute personne disposant du lien, pour la seule fourniture du service. ${L.brand} peut retirer une invitation au contenu manifestement illicite, sans remboursement.`,
        "Le lien de l'invitation n'est pas référencé par les moteurs de recherche, mais toute personne qui le reçoit peut l'ouvrir et le transférer : ne le partagez qu'avec vos invités.",
      ] },
      { h: "7. Durée et suppression", p: [
        `L'invitation reste en ligne jusqu'à environ ${months} mois après la date de l'événement ; elle est ensuite supprimée automatiquement avec sa photo et les réponses. Pensez à exporter vos réponses (CSV) depuis votre espace avant.`,
        `Un brouillon jamais publié est supprimé ${draftMonths} mois après sa dernière modification. Vous pouvez demander la suppression anticipée à ${L.email}.`,
      ] },
      { h: "8. Disponibilité et responsabilité", p: [
        "Nous faisons de notre mieux pour que le service soit accessible en permanence, sans pouvoir le garantir (maintenance, panne d'un prestataire, réseau). Les animations peuvent s'afficher différemment selon l'appareil et le navigateur.",
        "Notre responsabilité est limitée au prix payé pour l'invitation concernée, sauf faute lourde ou dommage corporel. Vérifiez les informations de votre invitation (date, lieu) avant de l'envoyer.",
      ] },
      { h: "9. Données personnelles", p: ["Le traitement de vos données et de celles de vos invités est décrit dans notre politique de confidentialité."] },
      { h: "10. Réclamations et médiation", p: [
        `Pour toute réclamation, écrivez à ${L.email} : nous répondons sous 7 jours.`,
        L.mediator
          ? `En l'absence d'accord, vous pouvez recourir gratuitement au médiateur de la consommation : ${L.mediator.name} (${L.mediator.url}).`
          : "En l'absence d'accord, vous pouvez recourir gratuitement à un médiateur de la consommation (articles L611-1 et suivants du Code de la consommation) ; ses coordonnées vous seront communiquées sur simple demande.",
      ] },
      { h: "11. Droit applicable", p: ["Les présentes conditions sont soumises au droit français. En cas de litige, les tribunaux français sont compétents, sans préjudice des règles protectrices du consommateur."] },
    ],
  },
  privacy: {
    title: "Politique de confidentialité",
    lead: `Cette politique explique quelles données ${L.brand} traite, pourquoi, combien de temps, et comment exercer vos droits (RGPD).`,
    sections: [
      { h: "Responsable du traitement", p: [`${L.owner}, EI (« ${L.brand} »), ${L.address}. Contact : ${L.email}.`] },
      { h: "Données des mariés (ou organisateurs)", p: [
        "Prénoms, date et lieu de l'événement, programme, textes, photo, préférences (modèle, langue) et adresse e-mail.",
        "Finalités : créer et afficher l'invitation, vous envoyer le lien de votre espace, la confirmation de publication et le récapitulatif quotidien des réponses. Base légale : exécution du contrat.",
        "Paiement : traité directement par Stripe ; nous conservons seulement la date, le montant et la référence du paiement.",
      ] },
      { h: "Données des invités", p: [
        "Nom, réponse (présent ou non), nombre de personnes et message facultatif.",
        "Finalité : transmettre la réponse aux mariés, qui la voient dans leur espace et dans leur récapitulatif par e-mail. Base légale : intérêt légitime (organiser l'événement). Ces données ne sont utilisées à aucune autre fin.",
      ] },
      { h: "Durée de conservation", p: [
        `Invitation, photo et réponses : supprimées automatiquement environ ${months} mois après la date de l'événement.`,
        `Brouillon jamais publié : supprimé ${draftMonths} mois après sa dernière modification.`,
        "Justificatifs de paiement : conservés par Stripe selon ses obligations légales.",
      ] },
      { h: "Destinataires et prestataires", p: [
        "Vos données ne sont ni vendues ni cédées. Elles sont traitées pour notre compte par :",
        `• hébergement du site : ${HOSTS.cloudflare} ;`,
        `• base de données et photos : ${HOSTS.supabase} ;`,
        `• envoi des e-mails : ${HOSTS.brevo} ;`,
        `• paiement : ${HOSTS.stripe}.`,
        "Certains de ces prestataires peuvent traiter des données hors de l'Union européenne ; ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne ou le cadre de protection des données UE–États-Unis.",
      ] },
      { h: "Cookies et stockage local", p: [
        "Nous mesurons la fréquentation et les performances du site avec Cloudflare Web Analytics : pages vues, visites, pages consultées, provenance, pays, type d'appareil et navigateur. Selon Cloudflare, cet outil n'utilise ni cookie ni stockage local et ne collecte ni n'utilise de données personnelles.",
        "Aucun cookie publicitaire ou de mesure d'audience n'est déposé. Nous utilisons seulement :",
        "• le cookie « lang » (langue choisie, 1 an) ;",
        "• le stockage local du navigateur, pour proposer de reprendre votre dernière invitation et ne montrer l'animation d'accueil qu'une fois.",
        "Ces éléments sont nécessaires au fonctionnement du site et ne demandent pas de consentement. La page de paiement Stripe dépose ses propres cookies, nécessaires à la sécurité du paiement.",
      ] },
      { h: "Vos droits", p: [
        `Vous pouvez accéder à vos données, les corriger, les supprimer, vous opposer à leur traitement, en limiter l'usage ou les récupérer : écrivez à ${L.email}. Les mariés peuvent aussi modifier leur invitation à tout moment depuis leur espace. Un invité peut demander la suppression de sa réponse.`,
        "Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la CNIL (cnil.fr).",
      ] },
      { h: "Sécurité", p: ["Connexions chiffrées (HTTPS), base de données inaccessible depuis le navigateur, accès à l'espace par un lien secret. Ne transférez pas le lien de votre espace : il donne accès aux réponses."] },
    ],
  },
};

const en: LegalDict = {
  updated: (d) => `Last updated: ${new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
  mentions: {
    title: "Legal notice",
    sections: [
      { h: "Publisher", p: [
        `${L.site} is published by ${L.owner}, sole trader (entrepreneur individuel, EI, France), trading as “${L.brand}”.`,
        `SIREN: ${L.siren}.`,
        `Address: ${L.address} (registered office provided by ${L.domiciliation}).`,
        `Contact: ${L.email}.`,
        L.vatFranchise ? "VAT not applicable, article 293 B of the French Tax Code." : "",
      ].filter(Boolean) },
      { h: "Publication director", p: [`${L.owner}.`] },
      { h: "Hosting", p: [`Website hosted by ${HOSTS.cloudflare}.`, `Data and photos stored by ${HOSTS.supabase}.`] },
      { h: "Intellectual property", p: [
        `Invitation templates, animations, illustrations, texts and the ${L.brand} logo are protected. Any reproduction without permission is prohibited.`,
        "Texts and photos added by the couple remain their property; they guarantee they hold the rights to them (see the Terms of sale).",
      ] },
      { h: "Report content", p: [`To report an invitation with unlawful content, email ${L.email} with its link.`] },
    ],
  },
  cgv: {
    title: "Terms of sale",
    lead: `These terms apply to any use of the ${L.brand} service and any purchase on ${L.site}. Publishing an invitation means you accept them. The French version prevails.`,
    sections: [
      { h: "1. Seller", p: [`${L.owner}, EI (“${L.brand}”), SIREN ${L.siren}, ${L.address}. Contact: ${L.email}.`] },
      { h: "2. Service", p: [
        `${L.brand} lets you create an animated online invitation (weddings and other events), send it through a private link and collect your guests' replies in a personal space.`,
        "Creating, previewing and saving an invitation is free. Only publishing is paid, when a price is shown in the editor.",
      ] },
      { h: "3. Price", p: [
        `The price is shown in the editor before any order, in euros, as a one-off payment per invitation${L.vatFranchise ? "; VAT not applicable, article 293 B of the French Tax Code" : ""}.`,
        "It includes: publishing the invitation, unlimited guests and replies, unlimited changes, and the invitation staying online until 3 months after the event date. An invitation already published is never charged twice.",
        "The price shown at the time of publishing applies.",
      ] },
      { h: "4. Order and payment", p: [
        "You order by clicking the paid publish button after accepting these terms. Payment is made by card on Stripe's secure page; we never see your card details.",
        "The invitation is published as soon as payment is confirmed. A confirmation email with your invitation link and your space link is sent to you.",
      ] },
      { h: "5. Right of withdrawal", p: [
        "The service is digital content supplied immediately after payment. Under article L221-28 13° of the French Consumer Code, by ticking the box shown before payment you request immediate performance and expressly waive your right of withdrawal.",
        `If a technical problem prevents you from using your invitation, email ${L.email}: we will find a solution or refund you.`,
      ] },
      { h: "6. Your content", p: [
        "You keep ownership of the texts and photos you add. You guarantee that you hold the rights to them (including the image rights of people shown) and that they are not unlawful, offensive or infringing.",
        `You allow us to host and display them to anyone who has the link, solely to provide the service. ${L.brand} may remove an invitation with clearly unlawful content, without refund.`,
        "The invitation link is not indexed by search engines, but anyone who receives it can open and forward it: only share it with your guests.",
      ] },
      { h: "7. Duration and deletion", p: [
        `The invitation stays online until about ${months} months after the event date; it is then automatically deleted along with its photo and replies. Export your replies (CSV) from your space beforehand.`,
        `A draft that is never published is deleted ${draftMonths} months after it was last changed. You can ask for earlier deletion at ${L.email}.`,
      ] },
      { h: "8. Availability and liability", p: [
        "We do our best to keep the service available at all times, without being able to guarantee it (maintenance, provider outage, network). Animations may look different depending on the device and browser.",
        "Our liability is limited to the price paid for the invitation concerned, except for gross negligence or personal injury. Check your invitation details (date, venue) before sending it.",
      ] },
      { h: "9. Personal data", p: ["How we process your data and your guests' data is described in our privacy policy."] },
      { h: "10. Complaints and mediation", p: [
        `For any complaint, email ${L.email}: we reply within 7 days.`,
        L.mediator
          ? `If we cannot agree, you may refer the matter free of charge to the consumer mediator: ${L.mediator.name} (${L.mediator.url}).`
          : "If we cannot agree, you may refer the matter free of charge to a consumer mediator (articles L611-1 et seq. of the French Consumer Code); their details are available on request.",
      ] },
      { h: "11. Governing law", p: ["These terms are governed by French law. French courts have jurisdiction, without prejudice to consumer protection rules."] },
    ],
  },
  privacy: {
    title: "Privacy policy",
    lead: `This policy explains what data ${L.brand} processes, why, for how long, and how to exercise your rights (GDPR).`,
    sections: [
      { h: "Data controller", p: [`${L.owner}, EI (“${L.brand}”), ${L.address}. Contact: ${L.email}.`] },
      { h: "Couple's (or host's) data", p: [
        "First names, event date and venue, schedule, texts, photo, preferences (template, language) and email address.",
        "Purposes: create and display the invitation, send you your space link, the publishing confirmation and the daily summary of replies. Legal basis: performance of the contract.",
        "Payment: handled directly by Stripe; we only keep the payment date, amount and reference.",
      ] },
      { h: "Guests' data", p: [
        "Name, reply (attending or not), number of people and optional message.",
        "Purpose: pass the reply on to the couple, who see it in their space and in their email summary. Legal basis: legitimate interest (organising the event). This data is used for no other purpose.",
      ] },
      { h: "Retention", p: [
        `Invitation, photo and replies: automatically deleted about ${months} months after the event date.`,
        `Draft never published: deleted ${draftMonths} months after it was last changed.`,
        "Payment records: kept by Stripe as required by law.",
      ] },
      { h: "Recipients and providers", p: [
        "Your data is never sold or transferred. It is processed on our behalf by:",
        `• website hosting: ${HOSTS.cloudflare};`,
        `• database and photos: ${HOSTS.supabase};`,
        `• sending emails: ${HOSTS.brevo};`,
        `• payment: ${HOSTS.stripe}.`,
        "Some of these providers may process data outside the European Union; such transfers are covered by the European Commission's standard contractual clauses or the EU–US Data Privacy Framework.",
      ] },
      { h: "Cookies and local storage", p: [
        "We measure site traffic and performance with Cloudflare Web Analytics: page views, visits, pages visited, referrals, country, device type and browser. According to Cloudflare, this tool uses neither cookies nor local storage and does not collect or use personal data.",
        "No advertising or analytics cookies are set. We only use:",
        "• the “lang” cookie (chosen language, 1 year);",
        "• your browser's local storage, to offer to resume your last invitation and to show the welcome animation only once.",
        "These are needed for the site to work and do not require consent. Stripe's payment page sets its own cookies, needed for payment security.",
      ] },
      { h: "Your rights", p: [
        `You can access, correct or delete your data, object to or restrict its processing, or get a copy: email ${L.email}. The couple can also edit their invitation at any time from their space. A guest can ask for their reply to be deleted.`,
        "If you believe your rights are not respected, you can complain to the CNIL (cnil.fr), the French data protection authority.",
      ] },
      { h: "Security", p: ["Encrypted connections (HTTPS), database not reachable from the browser, access to your space through a secret link. Do not forward your space link: it gives access to the replies."] },
    ],
  },
};

export const legalDict = (l: Lang): LegalDict => (l === "en" ? en : fr);
