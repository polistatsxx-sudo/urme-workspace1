import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url(https://media.base44.com/images/public/6a2e6b5c552bd19313d69f46/76bc2ea6f_3choice.png)' }}
      />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-10">
          <img
            src="https://media.base44.com/images/public/6a2e6b5c552bd19313d69f46/b43319c91_1choice.png"
            alt="URME"
            className="inline-block w-16 h-16 rounded-2xl object-cover mb-4 shadow-lg"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}