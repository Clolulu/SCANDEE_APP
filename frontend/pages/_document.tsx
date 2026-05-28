import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#0ea5e9" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="description" content="Scandee QR marketplace for customers and local vendors." />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
