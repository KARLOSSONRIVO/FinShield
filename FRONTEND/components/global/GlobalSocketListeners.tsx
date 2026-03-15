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

interface AssignmentUpdatedPayload {
    assignmentId: string;
    status: string;
}

interface InvoiceCreatedPayload {
    invoiceId: string;
    uploadedBy: string;
}

interface AnchorSuccessPayload {
    invoiceId: string;
}

interface AnchorFailedPayload {
    invoiceId: string;
    error: string;
}

interface AiCompletePayload {
    invoiceId: string;
    aiVerdict: string;
    aiRiskScore: number;
    riskLevel: string;
}

export function GlobalSocketListeners() {
    const socketCtx = useContext(SocketContext);
    const queryClient = useQueryClient();

    // ── Handlers defined unconditionally (Rules of Hooks) ──────────────
    const handleFlagged = useCallback((data: FlaggedPayload) => {
        toast({
            title: "Invoice Flagged",
            description: `Invoice flagged with risk score ${data.aiRiskScore} (${data.riskLevel})`,
            variant: "destructive",
        });
    }, []);

    const handleAssignmentCreated = useCallback((_data: AssignmentPayload) => {
        toast({
            title: "New Assignment",
            description: `You have been assigned to audit a new company.`,
        });
    }, []);

    const handleAssignmentUpdated = useCallback((_data: AssignmentUpdatedPayload) => {
        toast({
            title: "Assignment Updated",
            description: `An assignment status has changed.`,
        });
    }, []);

    const handleAssignmentDeactivated = useCallback((_data: AssignmentPayload) => {
        toast({
            title: "Assignment Deactivated",
            description: `An auditor assignment has been deactivated.`,
        });
    }, []);

    const handleInvoiceCreated = useCallback((_data: InvoiceCreatedPayload) => {
        toast({
            title: "New Invoice Uploaded",
            description: `A new invoice has been uploaded to your organization.`,
        });
    }, []);

    const handleAnchorSuccess = useCallback((_data: AnchorSuccessPayload) => {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
        toast({
            title: "Blockchain Anchored",
            description: `An invoice has been successfully anchored to the blockchain.`,
        });
    }, [queryClient]);

    const handleAnchorFailed = useCallback((data: AnchorFailedPayload) => {
        toast({
            title: "Blockchain Anchoring Failed",
            description: data.error || "An invoice could not be anchored to the blockchain.",
            variant: "destructive",
        });
    }, []);

    const handleAiComplete = useCallback((_data: AiCompletePayload) => {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }, [queryClient]);

    const handleInvalidateInvoices = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["invoices"] });
    }, [queryClient]);

    const handleInvalidateUsers = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.invalidateQueries({ queryKey: ["employees"] });
        queryClient.invalidateQueries({ queryKey: ["manager-employees"] });
    }, [queryClient]);

    const handleInvalidateOrgs = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["organizations"] });
    }, [queryClient]);

    const handleInvalidateAssignments = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
    }, [queryClient]);

    const handleAuditCreated = useCallback((data: any) => {
        queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
        if (data?.action === 'ORG_CREATED' || data?.action === 'ACCOUNT_LOCKED') {
            toast({
                title: "System Audit Activity",
                description: data.summary || "A critical system action occurred.",
            });
        }
    }, [queryClient]);

    // ── All useSocketEvent calls top-level (no conditionals) ────────────
    // useSocketEvent handles null socketCtx internally
    useSocketEvent(socketCtx, SocketEvents.INVOICE_FLAGGED, handleFlagged);
    useSocketEvent(socketCtx, SocketEvents.INVOICE_CREATED, handleInvoiceCreated);
    useSocketEvent(socketCtx, SocketEvents.INVOICE_PROCESSING, handleInvalidateInvoices);
    useSocketEvent(socketCtx, SocketEvents.INVOICE_AI_COMPLETE, handleAiComplete);
    useSocketEvent(socketCtx, SocketEvents.INVOICE_ANCHOR_SUCCESS, handleAnchorSuccess);
    useSocketEvent(socketCtx, SocketEvents.INVOICE_ANCHOR_FAILED, handleAnchorFailed);
    useSocketEvent(socketCtx, SocketEvents.INVOICE_LIST_INVALIDATE, handleInvalidateInvoices);

    useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_CREATED, handleAssignmentCreated);
    useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_CREATED, handleInvalidateAssignments);
    useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_UPDATED, handleAssignmentUpdated);
    useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_UPDATED, handleInvalidateAssignments);
    useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_DEACTIVATED, handleAssignmentDeactivated);
    useSocketEvent(socketCtx, SocketEvents.ASSIGNMENT_DEACTIVATED, handleInvalidateAssignments);

    useSocketEvent(socketCtx, SocketEvents.USER_LIST_INVALIDATE, handleInvalidateUsers);
    useSocketEvent(socketCtx, SocketEvents.ORG_LIST_INVALIDATE, handleInvalidateOrgs);
    useSocketEvent(socketCtx, SocketEvents.AUDIT_CREATED, handleAuditCreated);

    return null; // Render nothing — listener only
}
