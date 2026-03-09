"use client";

import { useContext, useCallback } from "react";
import { SocketContext } from "@/providers/socket-provider";
import { useSocketEvent } from "@/hooks/global/use-socket-event";
import { SocketEvents } from "@/lib/socket-events";
import { toast } from "@/hooks/global/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface FlaggedPayload {
    invoiceId: string;
    aiRiskScore: number;
    riskLevel: string;
}

interface AssignmentPayload {
    assignmentId: string;
    companyOrgId: string;
}

interface InvoiceCreatedPayload {
    invoiceId: string;
    uploadedBy: string;
}

export function GlobalSocketListeners() {
    const socketCtx = useContext(SocketContext);
    const queryClient = useQueryClient();

    const handleFlagged = useCallback((data: FlaggedPayload) => {
        toast({
            title: "Invoice Flagged",
            description: `Invoice flagged with risk score ${data.aiRiskScore} (${data.riskLevel})`,
            variant: "destructive",
        });
    }, []);

    const handleAssignmentCreated = useCallback((data: AssignmentPayload) => {
        toast({
            title: "New Assignment",
            description: `You have been assigned to audit a new company.`,
        });
    }, []);

    const handleInvoiceCreated = useCallback((data: InvoiceCreatedPayload) => {
        toast({
            title: "New Invoice Uploaded",
            description: `A new invoice has been uploaded to your organization.`,
        });
    }, []);

    // Set up listeners if socket context is available
    if (socketCtx) {
        useSocketEvent(socketCtx, SocketEvents.INVOICE_FLAGGED, handleFlagged);
        useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_CREATED, handleAssignmentCreated);
        useSocketEvent(socketCtx, SocketEvents.INVOICE_CREATED, handleInvoiceCreated);

        // Global App-Wide Invalidation Events (Triggers Tanstack Query Refresh)
        useSocketEvent(socketCtx, SocketEvents.INVOICE_LIST_INVALIDATE, () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        });

        useSocketEvent(socketCtx, SocketEvents.USER_LIST_INVALIDATE, () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            queryClient.invalidateQueries({ queryKey: ["manager-employees"] });
        });

        useSocketEvent(socketCtx, SocketEvents.ORG_LIST_INVALIDATE, () => {
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        });

        useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_CREATED, () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
        });
        useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_UPDATED, () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
        });
        useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_DEACTIVATED, () => {
            queryClient.invalidateQueries({ queryKey: ["assignments"] });
        });

        // Audit Log Real-time Updates
        // Payload matches `AuditLog` structure from backend
        useSocketEvent(socketCtx, SocketEvents.AUDIT_CREATED, (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["audit-logs"] });

            // Optional: Show toast for very specific high-priority audit events 
            // if we want Super Admins to be notified on-screen instantly.
            if (data?.action === 'ORG_CREATED' || data?.action === 'ACCOUNT_LOCKED') {
                toast({
                    title: "System Audit Activity",
                    description: data.summary || "A critical system action occurred.",
                });
            }
        });
    }

    return null; // Render nothing — listener only
}
