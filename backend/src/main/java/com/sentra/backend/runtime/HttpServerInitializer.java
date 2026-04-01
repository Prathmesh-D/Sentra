package com.sentra.backend.runtime;

import com.sentra.backend.auth.AuthIdentityModule;
import com.sentra.backend.encryption.CryptoServiceAdapter;
import com.sentra.backend.encryption.EncryptionApiModule;
import com.sentra.backend.files.FileLifecycleModule;
import com.sentra.backend.recipients.RecipientsContactsModule;
import com.sentra.backend.users.UserStatsDashboardModule;
import com.mongodb.client.MongoDatabase;

import java.util.List;
import java.util.function.BooleanSupplier;

public final class HttpServerInitializer {
    private HttpServerInitializer() {
    }

    public static HttpServerApp initialize(AppConfig config,
                                           MongoDatabase db,
                                           AuthIdentityModule authModule,
                                           RecipientsContactsModule recipientsModule,
                                           UserStatsDashboardModule usersModule,
                                           FileLifecycleModule filesModule,
                                           CryptoServiceAdapter cryptoAdapter,
                                           EncryptionApiModule encryptionModule,
                                           List<String> corsOrigins,
                                           BooleanSupplier readyCheck) {
        return new HttpServerApp(
            config,
            db,
            authModule,
            recipientsModule,
            usersModule,
            filesModule,
            cryptoAdapter,
            encryptionModule,
            corsOrigins,
            readyCheck
        );
    }
}
