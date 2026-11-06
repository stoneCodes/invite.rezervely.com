/* Textes des e-mails envoyés aux mariés, par langue (langue du site au moment où ils ont enregistré).
   Toute clé ajoutée en français doit exister en anglais (typecheck). Les valeurs sont du texte brut : lib/email.ts les échappe. */
import type { Lang } from "./index";

const fr = {
  common: {
    hello: (names: string) => `Bonjour ${names},`,
    openSpace: "Ouvrir mon espace",
    edit: "Modifier l'invitation",
    keep: "Gardez cet e-mail : le lien de votre espace est personnel, il donne accès à vos réponses et à la modification de l'invitation.",
    footer: "Vous recevez cet e-mail parce que cette adresse a été indiquée lors de la création d'une invitation sur joyeuxevent.",
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
    share: "Lien à partager",
    open: "Voir l'invitation",
    after: "Les réponses arrivent dans votre espace. Vous recevrez aussi un récapitulatif par e-mail, au plus une fois par jour.",
  },
  recap: {
    subject: (n: number, names: string) => `${n} nouvelle${n > 1 ? "s" : ""} réponse${n > 1 ? "s" : ""} pour ${names}`,
    title: (n: number) => `${n} nouvelle${n > 1 ? "s" : ""} réponse${n > 1 ? "s" : ""}`,
    yes: (g: number) => `Présent · ${g} personne${g > 1 ? "s" : ""}`,
    no: "Ne pourra pas venir",
    totals: (yes: number, no: number) => `Depuis le début : ${yes} personne${yes > 1 ? "s" : ""} présente${yes > 1 ? "s" : ""}, ${no} absence${no > 1 ? "s" : ""}.`,
  },
  links: {
    subject: "Vos liens joyeuxevent",
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
    footer: "You are receiving this email because this address was entered when an invitation was created on joyeuxevent.",
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
    share: "Link to share",
    open: "View the invitation",
    after: "Replies arrive in your space. You will also get an email summary, at most once a day.",
  },
  recap: {
    subject: (n, names) => `${n} new repl${n > 1 ? "ies" : "y"} for ${names}`,
    title: (n) => `${n} new repl${n > 1 ? "ies" : "y"}`,
    yes: (g) => `Attending · ${g} guest${g > 1 ? "s" : ""}`,
    no: "Can't make it",
    totals: (yes, no) => `So far: ${yes} guest${yes > 1 ? "s" : ""} attending, ${no} declined.`,
  },
  links: {
    subject: "Your joyeuxevent links",
    title: "Your invitations",
    body: "You asked to find your space again. Here is the link for each invitation created with this address.",
    ignore: "If you didn't make this request, simply ignore this email.",
  },
};

const DICTS: Record<Lang, EmailDict> = { fr, en };
export const emailDict = (l?: Lang | null): EmailDict => DICTS[l === "en" ? "en" : "fr"];
