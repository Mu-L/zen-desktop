import { CardList, Card, Tag, Collapse, HTMLTable, Intent } from '@blueprintjs/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// eslint-disable-next-line import/no-relative-packages
import { EventsOn } from '../../wailsjs/runtime';
import { getCurrentLocale } from '../i18n';
import './index.css';

type Rule = {
  FilterName: string;
  RawRule: string;
};

enum FilterActionKind {
  Block = 'block',
  Redirect = 'redirect',
  Modify = 'modify',
}

type FilterAction = {
  id: string;
  kind: FilterActionKind;
  method: string;
  url: string;
  to: string;
  referer: string;
  rules: Rule[];
  createdAt: Date;
};

export function RequestLog() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<FilterAction[]>([]);

  useEffect(() => {
    const cancel = EventsOn('filter:action', (action: Omit<FilterAction, 'id' | 'createdAt'>) => {
      setLogs((logs) =>
        [
          {
            ...action,
            id: id(),
            createdAt: new Date(),
          },
          ...logs,
        ].slice(0, 200),
      );
    });

    return () => {
      cancel();
    };
  }, []);

  return (
    <div className="request-log">
      {logs.length === 0 ? (
        <p className="request-log__empty">{t('requestLog.emptyState')}</p>
      ) : (
        <CardList compact>
          {logs.map((log) => (
            <RequestLogCard log={log} key={log.id} />
          ))}
        </CardList>
      )}
    </div>
  );
}

function RequestLogCard({ log }: { log: FilterAction }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const { hostname } = new URL(log.url, 'http://foo'); // Setting the base url somehow helps with parsing //hostname:port URLs

  let tagIntent: Intent;
  switch (log.kind) {
    case FilterActionKind.Block:
      tagIntent = Intent.DANGER;
      break;
    case FilterActionKind.Modify:
      tagIntent = Intent.WARNING;
      break;
    case FilterActionKind.Redirect:
      tagIntent = Intent.WARNING;
      break;
    default:
      tagIntent = Intent.NONE;
  }
  return (
    <>
      <Card key={log.id} className="request-log__card" interactive onClick={() => setIsOpen(!isOpen)}>
        <Tag minimal intent={tagIntent}>
          {hostname}
        </Tag>
        <div className="bp5-text-muted">
          {log.createdAt.toLocaleTimeString(getCurrentLocale(), { timeStyle: 'short' })}
        </div>
      </Card>

      <Collapse isOpen={isOpen}>
        <Card className="request-log__card__details">
          <p className="request-log__card__details__value">
            <strong>{t('requestLog.method')}: </strong>
            <Tag minimal intent="primary">
              {log.method}
            </Tag>
          </p>
          <p className="request-log__card__details__value">
            <strong>{t('requestLog.url')}: </strong>
            {log.url}
          </p>
          {log.kind === FilterActionKind.Redirect && (
            <p className="request-log__card__details__value">
              <strong>{t('requestLog.redirectedTo')}: </strong>
              {log.to}
            </p>
          )}
          {log.referer && (
            <p className="request-log__card__details__value">
              <strong>{t('requestLog.referer')}: </strong>
              {log.referer}
            </p>
          )}
          <HTMLTable bordered compact striped className="request-log__card__details__rules">
            <thead>
              <tr>
                <th>{t('requestLog.filterName')}</th>
                <th>{t('requestLog.rule')}</th>
              </tr>
            </thead>
            <tbody>
              {log.rules.map((rule) => (
                <tr key={rule.RawRule}>
                  <td>{rule.FilterName}</td>
                  <td>{rule.RawRule}</td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </Card>
      </Collapse>
    </>
  );
}

function id(): string {
  return Math.random().toString(36).slice(2, 9);
}
