import { useAsyncFn } from 'react-use';
import { api } from './api.ts';
import styles from './app.module.css';

export const App = () => {
  const [{ error, loading, value }, ping] = useAsyncFn(async () => {
    const response = await api.ping.$get();

    if (!response.ok) {
      throw new Error(`Ping failed with status ${response.status}`);
    }

    return response.text();
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.kicker}>api probe</p>
        <h1 className={styles.title}>Ping</h1>
        <p className={styles.description}>A single-action health check with a minimal brutalist shell.</p>

        <button className={styles.button} disabled={loading} onClick={ping} type="button">
          {loading ? 'Pinging...' : 'Ping server'}
        </button>

        <output aria-live="polite" className={styles.output} data-state={error ? 'error' : value ? 'success' : 'idle'}>
          {error ? error.message : (value ?? 'No response yet.')}
        </output>
      </section>
    </main>
  );
};
