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
import type { Ad, Partner } from "@/lib/types"
import { toast } from "sonner"

interface DeleteAdDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ad: Ad & { partner?: Partner }
}

export function DeleteAdDialog({ open, onOpenChange, ad }: DeleteAdDialogProps) {
  const { deleteAd } = useStore()

  const handleDelete = async () => {
    try {
      let id = Number(ad.id)
      console.log('DeleteAdDialog: Attempting to delete ad', { id, ad })
      
      if (!Number.isFinite(id)) {
        toast.error("Hiba: érvénytelen hirdetés azonosító")
        return
      }
      
      await deleteAd(id)
      await useStore.getState().loadData()
      toast.success("Hirdetés sikeresen törölve!")
      onOpenChange(false)
    } catch (e) {
      console.error('DeleteAdDialog error:', e)
      toast.error("Hiba: nem sikerült törölni a hirdetést")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hirdetés törlése</AlertDialogTitle>
          <AlertDialogDescription>
            Biztosan törölni szeretné a(z) "{ad.positionName}" hirdetést? Ez a művelet nem vonható vissza.
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
