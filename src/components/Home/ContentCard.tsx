"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { ContentItem, ContentCardProps } from "@/types/Home/home";

export type { ContentItem, ContentCardProps };

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  icon: Icon,
  items,
  href,
  renderItem,
  iconColor,
  itemVariants,
}) => {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconColor}`}>
              <Icon size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-lg text-[var(--foreground)]">
              {title}
            </h3>
          </div>
          <Link
            href={href}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group"
          >
            {t("home.sections.viewAll")}
            <ArrowIcon
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>
      </div>
      <div className="p-4">
        {items.length > 0 ? (
          <ul className="space-y-3">
            {items.slice(0, 3).map((item) => renderItem(item))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
            {t("home.sections.noItems")}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ContentCard;
