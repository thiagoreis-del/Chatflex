import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Mail, Pencil, Phone, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { contactKeys } from "@/shared/api/query-keys";
import { contactInitials, contactPhotoUrl } from "../contact-photo";
import { getContact, refreshContactProfilePicture } from "../api";
import type { Contact } from "../types";

interface Props {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
  onPhotoUpdated: (photoUrl: string) => void;
}

export function ContactInfoDialog({ contact, onClose, onEdit, onPhotoUpdated }: Props) {
  const { t } = useTranslation("contacts");
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [failedPhoto, setFailedPhoto] = useState<string>();
  const detailKey = contactKeys.detail(contact.id);
  const details = useQuery({
    queryKey: detailKey,
    queryFn: () => getContact(contact.id),
    initialData: contact,
  });
  const value = details.data;
  const photo = contactPhotoUrl(value.profilePicUrl);
  const refresh = useMutation({
    mutationFn: () => refreshContactProfilePicture(contact.id),
    onSuccess: async ({ profilePicUrl }) => {
      if (!contactPhotoUrl(profilePicUrl)) return;
      await qc.cancelQueries({ queryKey: detailKey, exact: true });
      if (!detailKey.every((part, index) => part === contactKeys.detail(contact.id)[index])) return;
      qc.setQueryData<Contact>(detailKey, (current) =>
        current ? { ...current, profilePicUrl } : current,
      );
      onPhotoUpdated(profilePicUrl);
    },
  });
  const imageFailed = !!photo && photo === failedPhoto;
  const result = refresh.data;
  const feedback = refresh.isPending
    ? "refreshing"
    : refresh.isError || result?.status === "retry"
      ? "refreshFailed"
      : result?.status === "disconnected"
        ? "disconnected"
        : result && !contactPhotoUrl(result.profilePicUrl)
          ? "unavailable"
          : imageFailed
            ? "imageFailed"
            : result
              ? "updated"
              : null;

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-md">
          <DialogTitle className="sr-only">{t("profile.title")}</DialogTitle>
          <div className="h-28 bg-gradient-to-br from-emerald-600/30 via-emerald-500/10 to-background" />
          <div className="-mt-16 flex flex-col items-center px-5 pb-5 text-center">
            <button
              type="button"
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => photo && setExpanded(true)}
              aria-label={t("profile.viewPhoto")}
              disabled={!photo || imageFailed}
            >
              <Avatar className="size-28 border-4 border-background shadow-md">
                <AvatarImage
                  src={photo}
                  alt={value.name}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  onLoadingStatusChange={(status) => {
                    if (status === "error") setFailedPhoto(photo);
                    if (status === "loaded") setFailedPhoto(undefined);
                  }}
                />
                <AvatarFallback className="bg-primary/10 text-3xl font-semibold text-primary">
                  {contactInitials(value.name)}
                </AvatarFallback>
              </Avatar>
            </button>
            <h2 className="mt-3 text-xl font-semibold">{value.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">+{value.number}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh.mutate()}
                disabled={refresh.isPending}
              >
                <RefreshCw
                  className={`mr-1.5 size-4 ${refresh.isPending ? "animate-spin" : ""}`}
                  aria-hidden
                />
                {t("profile.refreshPhoto")}
              </Button>
              <Button size="sm" onClick={() => onEdit(value)}>
                <Pencil className="mr-1.5 size-4" aria-hidden />
                {t("actions.edit")}
              </Button>
            </div>
            <p role="status" className="mt-2 text-sm text-muted-foreground">
              {feedback ? t(`profile.${feedback}`) : null}
            </p>
          </div>
          <div className="space-y-3 border-t px-5 py-4 text-sm">
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground" aria-hidden />
              <span>+{value.number}</span>
            </div>
            {value.email ? (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" aria-hidden />
                <span className="break-all">{value.email}</span>
              </div>
            ) : null}
            {value.whatsapp?.name ? (
              <p className="text-muted-foreground">
                {t("profile.connection")}:{" "}
                <span className="text-foreground">{value.whatsapp.name}</span>
              </p>
            ) : null}
            {(value.extraInfo ?? [])
              .filter((item) => item.name && item.value)
              .map((item) => (
                <div key={`${item.id ?? item.name}-${item.value}`}>
                  <p className="text-xs text-muted-foreground">{item.name}</p>
                  <p className="break-words">{item.value}</p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="border-0 bg-black/95 p-2 sm:max-w-3xl">
          <DialogTitle className="sr-only">
            {t("profile.photoOf", { name: value.name })}
          </DialogTitle>
          {photo ? (
            <img
              src={photo}
              alt={value.name}
              className="max-h-[85dvh] w-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
