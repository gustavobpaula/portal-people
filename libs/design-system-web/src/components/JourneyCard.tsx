import {
  forwardRef,
  type AnchorHTMLAttributes,
  type MouseEvent,
} from "react";
import { cx } from "../class-names";
import styles from "../components.module.scss";
import { Icon, type IconName } from "./Icon";
import { Text } from "./Text";

export interface JourneyCardProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  title: string;
  description: string;
  icon?: IconName;
  eyebrow?: string;
  badge?: string;
  onNavigate?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export const JourneyCard = forwardRef<HTMLAnchorElement, JourneyCardProps>(
  function JourneyCard(
    {
      title,
      description,
      icon = "chevron-right",
      eyebrow,
      badge,
      onNavigate,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <a
        {...props}
        ref={ref}
        className={cx(styles.journeyCard, className)}
        onClick={onNavigate}
      >
        <span className={styles.journeyIcon}>
          <Icon name={icon} />
        </span>
        <span className={styles.journeyContent}>
          {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
          <Text as="span" variant="label" weight="bold">
            {title}
          </Text>
          <span className={styles.journeyDescription}>{description}</span>
          {children}
        </span>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
        <Icon name="chevron-right" />
      </a>
    );
  },
);
