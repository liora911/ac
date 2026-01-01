"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    backgroundColor: "#ffffff",
  },
  // Header section
  header: {
    marginBottom: 20,
  },
  bannerImage: {
    width: "100%",
    height: 150,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#111827",
    maxWidth: "70%",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#dcfce7",
  },
  statusText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#166534",
  },
  categoryBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryText: {
    fontSize: 10,
    color: "#374151",
  },
  // Divider
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: "#e5e7eb",
    borderStyle: "dashed",
    marginVertical: 20,
    position: "relative",
  },
  // Two column layout
  contentRow: {
    flexDirection: "row",
    gap: 30,
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  // Info rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  iconBoxBlue: {
    backgroundColor: "#dbeafe",
  },
  iconBoxPurple: {
    backgroundColor: "#f3e8ff",
  },
  iconBoxGreen: {
    backgroundColor: "#dcfce7",
  },
  iconBoxOrange: {
    backgroundColor: "#ffedd5",
  },
  iconBoxPink: {
    backgroundColor: "#fce7f3",
  },
  iconBoxTeal: {
    backgroundColor: "#ccfbf1",
  },
  iconBoxIndigo: {
    backgroundColor: "#e0e7ff",
  },
  iconText: {
    fontSize: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 11,
    color: "#111827",
    fontWeight: 700,
  },
  // Notes section
  notesBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#6b7280",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 10,
    color: "#374151",
  },
  // Footer
  footer: {
    marginTop: 25,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {},
  footerText: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketIcon: {
    fontSize: 16,
    color: "#2563eb",
    marginRight: 6,
  },
  keepTicketText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#4b5563",
  },
});

export interface TicketPDFData {
  id: string;
  holderName: string;
  holderEmail: string;
  holderPhone: string | null;
  numberOfSeats: number;
  status: string;
  notes: string | null;
  createdAt: string;
  event: {
    title: string;
    eventDate: string;
    eventTime: string | null;
    location: string | null;
    eventType: string;
    onlineUrl: string | null;
    bannerImageUrl: string | null;
    category: {
      name: string;
    };
  };
}

export interface TicketPDFLabels {
  eventDetails: string;
  ticketHolder: string;
  date: string;
  time: string;
  location: string;
  onlineLink: string;
  name: string;
  email: string;
  phone: string;
  seats: string;
  seat: string;
  seatsPlural: string;
  notes: string;
  ticketId: string;
  reservedOn: string;
  keepTicket: string;
  statusConfirmed: string;
  statusPending: string;
  statusCancelled: string;
  statusAttended: string;
}

interface TicketPDFDocumentProps {
  ticket: TicketPDFData;
  labels: TicketPDFLabels;
  locale: string;
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return { bg: "#dcfce7", color: "#166534" };
    case "PENDING":
      return { bg: "#fef9c3", color: "#854d0e" };
    case "CANCELLED":
      return { bg: "#fee2e2", color: "#991b1b" };
    case "ATTENDED":
      return { bg: "#dbeafe", color: "#1e40af" };
    default:
      return { bg: "#f3f4f6", color: "#374151" };
  }
};

const getStatusText = (status: string, labels: TicketPDFLabels) => {
  switch (status) {
    case "CONFIRMED":
      return labels.statusConfirmed;
    case "PENDING":
      return labels.statusPending;
    case "CANCELLED":
      return labels.statusCancelled;
    case "ATTENDED":
      return labels.statusAttended;
    default:
      return status;
  }
};

const formatDate = (date: string, locale: string) => {
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  return new Date(date).toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (date: string, locale: string) => {
  const dateLocale = locale === "he" ? "he-IL" : "en-US";
  return new Date(date).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const TicketPDFDocument: React.FC<TicketPDFDocumentProps> = ({
  ticket,
  labels,
  locale,
}) => {
  const statusStyle = getStatusStyle(ticket.status);
  const isRTL = locale === "he";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {ticket.event.bannerImageUrl && (
            <Image
              src={ticket.event.bannerImageUrl}
              style={styles.bannerImage}
            />
          )}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{ticket.event.title}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
            >
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {getStatusText(ticket.status, labels)}
              </Text>
            </View>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{ticket.event.category.name}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        <View style={styles.contentRow}>
          {/* Event Details Column */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>{labels.eventDetails}</Text>

            <View style={styles.infoRow}>
              <View style={[styles.iconBox, styles.iconBoxBlue]}>
                <Text style={styles.iconText}>📅</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{labels.date}</Text>
                <Text style={styles.infoValue}>
                  {formatDate(ticket.event.eventDate, locale)}
                </Text>
              </View>
            </View>

            {ticket.event.eventTime && (
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, styles.iconBoxPurple]}>
                  <Text style={styles.iconText}>🕐</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{labels.time}</Text>
                  <Text style={styles.infoValue}>{ticket.event.eventTime}</Text>
                </View>
              </View>
            )}

            {ticket.event.location && (
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, styles.iconBoxGreen]}>
                  <Text style={styles.iconText}>📍</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{labels.location}</Text>
                  <Text style={styles.infoValue}>{ticket.event.location}</Text>
                </View>
              </View>
            )}

            {ticket.event.eventType === "online" && ticket.event.onlineUrl && (
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, styles.iconBoxBlue]}>
                  <Text style={styles.iconText}>🌐</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{labels.onlineLink}</Text>
                  <Text style={[styles.infoValue, { color: "#2563eb" }]}>
                    {ticket.event.onlineUrl}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Ticket Holder Column */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>{labels.ticketHolder}</Text>

            <View style={styles.infoRow}>
              <View style={[styles.iconBox, styles.iconBoxOrange]}>
                <Text style={styles.iconText}>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{labels.name}</Text>
                <Text style={styles.infoValue}>{ticket.holderName}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.iconBox, styles.iconBoxPink]}>
                <Text style={styles.iconText}>✉️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{labels.email}</Text>
                <Text style={styles.infoValue}>{ticket.holderEmail}</Text>
              </View>
            </View>

            {ticket.holderPhone && (
              <View style={styles.infoRow}>
                <View style={[styles.iconBox, styles.iconBoxTeal]}>
                  <Text style={styles.iconText}>📞</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{labels.phone}</Text>
                  <Text style={styles.infoValue}>{ticket.holderPhone}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={[styles.iconBox, styles.iconBoxIndigo]}>
                <Text style={styles.iconText}>👥</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{labels.seats}</Text>
                <Text style={styles.infoValue}>
                  {ticket.numberOfSeats}{" "}
                  {ticket.numberOfSeats === 1
                    ? labels.seat
                    : labels.seatsPlural}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        {ticket.notes && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>{labels.notes}</Text>
            <Text style={styles.notesText}>{ticket.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerText}>
              {labels.ticketId}: {ticket.id.slice(0, 8)}...
            </Text>
            <Text style={styles.footerText}>
              {labels.reservedOn}: {formatDateTime(ticket.createdAt, locale)}
            </Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.ticketIcon}>🎫</Text>
            <Text style={styles.keepTicketText}>{labels.keepTicket}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
