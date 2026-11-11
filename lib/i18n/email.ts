/* Textes des e-mails envoyés aux mariés, par langue (langue du site au moment où ils ont enregistré).
   Toute clé ajoutée en français doit exister en anglais (typecheck). Les valeurs sont du texte brut : lib/email.ts les échappe. */
import type { Lang } from "./index";

const fr = {
  common: {
    hello: (names: string) => `Bonjour ${names},`,
    openSpace: "Ouvrir mon espace",
    edit: "Modifier l'invitation",
    keep: "Gardez cet e-mail : le lien de votre espace est personnel, il donne accès à vos réponses et à la modification de l'invitation.",
    footer: "Vous recevez cet e-mail parce que cette adresse a été indiquée lors de la création d'une invitation sur E-carte Studio.",
    tagline: "Invitations animées à partager",
    couple: (a: string, b: string) => `${a} & ${b}`,
  },
  welcome: {
    subject: "Votre invitation est enregistrée",
    title: "Votre invitation est enregistrée",
    body: "Vous pouvez la modifier quand vous voulez, la publier, puis suivre les réponses de vos invités depuis votre espace.",
  },
  published: {
    subject: (names: string) => `L'invitation de ${names} est en ligne`,
    title: "Votre invitation est en ligne",
    body: "Voici le lien à envoyer à vos invités (WhatsApp, SMS, e-mail…). Chacun pourra l'ouvrir et vous répondre.",
    share: "Lien à partager (à copier)",
    wa: "Envoyer sur WhatsApp",
    waMsg: (url: string) => `Vous êtes invités 💌
${url}`,
    open: "Voir l'invitation",
    cardAlt: (names: string) => `Invitation de ${names} : touchez pour l'ouvrir`,
    after: "Les réponses arrivent dans votre espace. Vous recevrez aussi un récapitulatif par e-mail, au plus une fois par jour.",
  },
  recap: {
    subject: (n: number, names: string) => `${n} nouvelle${n > 1 ? "s" : ""} réponse${n > 1 ? "s" : ""} pour ${names}`,
    title: (n: number) => `${n} nouvelle${n > 1 ? "s" : ""} réponse${n > 1 ? "s" : ""}`,
    yes: (g: number) => `Présent · ${g} personne${g > 1 ? "s" : ""}`,
    no: "Ne pourra pas venir",
    totals: (yes: number, no: number) => `Depuis le début : ${yes} personne${yes > 1 ? "s" : ""} présente${yes > 1 ? "s" : ""}, ${no} absence${no > 1 ? "s" : ""}.`,
  },
  aftercare: {
    event: { mariage: "votre mariage", anniversaire: "votre fête", "baby-shower": "votre baby shower" } as Record<string, string>,
    stop: "Vous ne souhaitez plus recevoir ce type d'e-mail ?",
    stopLink: "Se désabonner",
  },
  review: {
    subject: (event: string) => `Comment s'est passé${event === "votre fête" ? "e" : ""} ${event} ?`,
    body: (event: string) => `Nous espérons que ${event} a été un très beau moment, et que vos invités ont aimé recevoir votre invitation.`,
    ask: "Votre avis compte beaucoup pour nous : il nous aide à nous améliorer et guide celles et ceux qui préparent leur événement. Cela prend une minute.",
    button: "Donner mon avis",
    thanks: "Merci encore de nous avoir fait confiance pour ce moment.",
  },
  followup: {
    subject: "Un nouvel événement en vue ?",
    body: (event: string) => `Il y a quelques semaines, vous avez invité vos proches à ${event} avec E-carte Studio. Nous espérons que vous en gardez un très beau souvenir.`,
    next: "Un anniversaire, une fête de famille… Si un nouvel événement se prépare, votre prochaine invitation se crée en quelques minutes.",
    friend: "Et si un proche prépare son mariage ou sa fête, n'hésitez pas à lui parler de nous.",
    code: "Votre code de réduction, à utiliser ou à offrir",
    button: "Créer une invitation",
  },
  links: {
    subject: "Vos liens E-carte Studio",
    title: "Vos invitations",
    body: "Vous avez demandé à retrouver votre espace. Voici le lien de chaque invitation créée avec cette adresse.",
    ignore: "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet e-mail.",
  },
};

export type EmailDict = typeof fr;

const en: EmailDict = {
  common: {
    hello: (names) => `Hello ${names},`,
    openSpace: "Open my space",
    edit: "Edit the invitation",
    keep: "Keep this email: your space link is personal. It gives access to your replies and lets you edit the invitation.",
    footer: "You are receiving this email because this address was entered when an invitation was created on E-carte Studio.",
    tagline: "Animated invitations to share",
    couple: (a, b) => `${a} & ${b}`,
  },
  welcome: {
    subject: "Your invitation is saved",
    title: "Your invitation is saved",
    body: "You can edit it whenever you like, publish it, then follow your guests' replies from your space.",
  },
  published: {
    subject: (names) => `${names}'s invitation is live`,
    title: "Your invitation is live",
    body: "Here is the link to send to your guests (WhatsApp, text, email…). Everyone can open it and reply.",
    share: "Link to share (copy it)",
    wa: "Send on WhatsApp",
    waMsg: (url) => `You're invited 💌
${url}`,
    open: "View the invitation",
    cardAlt: (names) => `${names}'s invitation: tap to open`,
    after: "Replies arrive in your space. You will also get an email summary, at most once a day.",
  },
  recap: {
    subject: (n, names) => `${n} new repl${n > 1 ? "ies" : "y"} for ${names}`,
    title: (n) => `${n} new repl${n > 1 ? "ies" : "y"}`,
    yes: (g) => `Attending · ${g} guest${g > 1 ? "s" : ""}`,
    no: "Can't make it",
    totals: (yes, no) => `So far: ${yes} guest${yes > 1 ? "s" : ""} attending, ${no} declined.`,
  },
  aftercare: {
    event: { mariage: "your wedding", anniversaire: "your party", "baby-shower": "your baby shower" },
    stop: "Don't want to receive this kind of email?",
    stopLink: "Unsubscribe",
  },
  review: {
    subject: (event) => `How was ${event}?`,
    body: (event) => `We hope ${event} was a wonderful moment, and that your guests loved receiving your invitation.`,
    ask: "Your opinion means a lot to us: it helps us improve and guides people planning their own event. It only takes a minute.",
    button: "Leave a review",
    thanks: "Thank you again for trusting us with this moment.",
  },
  followup: {
    subject: "Another event coming up?",
    body: (event) => `A few weeks ago, you invited your loved ones to ${event} with E-carte Studio. We hope you have wonderful memories of it.`,
    next: "A birthday, a family party… If a new event is on the way, your next invitation only takes a few minutes to create.",
    friend: "And if someone close to you is planning a wedding or a party, feel free to tell them about us.",
    code: "Your discount code, to use or to share",
    button: "Create an invitation",
  },
  links: {
    subject: "Your E-carte Studio links",
    title: "Your invitations",
    body: "You asked to find your space again. Here is the link for each invitation created with this address.",
    ignore: "If you didn't make this request, simply ignore this email.",
  },
};

const DICTS: Record<Lang, EmailDict> = { fr, en };
export const emailDict = (l?: Lang | null): EmailDict => DICTS[l === "en" ? "en" : "fr"];
