"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useStore } from "@/lib/db-store"
import type { Partner } from "@/lib/types"
import { toast } from "sonner"

interface DeletePartnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  partner: Partner
}

export function DeletePartnerDialog({ open, onOpenChange, partner }: DeletePartnerDialogProps) {
  const { deletePartner, ads } = useStore()

  const partnerAds = ads.filter((ad) => ad.partnerId === partner.id)

  const handleDelete = () => {
    deletePartner(partner.id)
    toast.success("Partner sikeresen törölve!")
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Partner törlése</AlertDialogTitle>
          <AlertDialogDescription>
            Biztosan törölni szeretné a(z) "{partner.name} - {partner.office}" partnert?
            {partnerAds.length > 0 && (
              <>
                <br />
                <br />
                <strong className="text-destructive">
                  Figyelem: {partnerAds.length} hirdetés is törlődik ezzel a partnerrel!
                </strong>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Mégse</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Törlés
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
