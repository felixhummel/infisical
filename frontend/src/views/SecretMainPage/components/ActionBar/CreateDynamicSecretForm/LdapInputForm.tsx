import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ms from "ms";
import { z } from "zod";

import { TtlFormLabel } from "@app/components/features";
import { createNotification } from "@app/components/notifications";
import { Button, FormControl, Input, TextArea } from "@app/components/v2";
import { useCreateDynamicSecret } from "@app/hooks/api";
import { DynamicSecretProviders } from "@app/hooks/api/dynamicSecret/types";

const formSchema = z.object({
    provider: z.object({
        url: z.string().trim().min(1),
        binddn: z.string().trim().min(1),
        bindpass: z.string().trim().min(1),
        ca: z.string().optional(),

        creationLdif: z.string().trim().min(1),
        revocationLdif: z.string().trim().min(1),
        rollbackLdif: z.string().trim().min(1),
    }),

    defaultTTL: z.string().superRefine((val, ctx) => {
        const valMs = ms(val);
        if (valMs < 60 * 1000)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TTL must be a greater than 1min" });
        // a day
        if (valMs > 24 * 60 * 60 * 1000)
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TTL must be less than a day" });
    }),
    maxTTL: z
        .string()
        .optional()
        .superRefine((val, ctx) => {
            if (!val) return;
            const valMs = ms(val);
            if (valMs < 60 * 1000)
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TTL must be a greater than 1min" });
            // a day
            if (valMs > 24 * 60 * 60 * 1000)
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "TTL must be less than a day" });
        }),
    name: z.string().refine((val) => val.toLowerCase() === val, "Must be lowercase")
});

type TForm = z.infer<typeof formSchema>;

type Props = {
    onCompleted: () => void;
    onCancel: () => void;
    secretPath: string;
    projectSlug: string;
    environment: string;
};

export const LdapInputForm = (
    {
        onCompleted,
        onCancel,
        secretPath,
        projectSlug,
        environment,
    }: Props
) => {
    const {
        control,
        formState: { isSubmitting },
        handleSubmit
    } = useForm<TForm>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            provider: {
                url: "",
                binddn: "",
                bindpass: "",
                ca: "",
                creationLdif: "",
                revocationLdif: "",
                rollbackLdif: ""
            },
        }
    });

    const createDynamicSecret = useCreateDynamicSecret();

    const handleCreateDynamicSecret = async ({ name, maxTTL, provider, defaultTTL }: TForm) => {
        // wait till previous request is finished
        if (createDynamicSecret.isLoading) return;
        try {
            await createDynamicSecret.mutateAsync({
                provider: { type: DynamicSecretProviders.Ldap, inputs: provider },
                maxTTL,
                name,
                path: secretPath,
                defaultTTL,
                projectSlug,
                environmentSlug: environment
            });
            onCompleted();
        } catch (err) {
            createNotification({
                type: "error",
                text: "Failed to create dynamic secret"
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(handleCreateDynamicSecret)} autoComplete="off">
                <div>
                    <div className="flex items-center space-x-2">
                        <div className="flex-grow">
                            <Controller
                                control={control}
                                defaultValue=""
                                name="name"
                                render={({ field, fieldState: { error } }) => (
                                    <FormControl
                                        label="Secret Name"
                                        isError={Boolean(error)}
                                        errorText={error?.message}
                                    >
                                        <Input {...field} placeholder="dynamic-secret" />
                                    </FormControl>
                                )}
                            />
                        </div>
                        <div className="w-32">
                            <Controller
                                control={control}
                                name="defaultTTL"
                                defaultValue="1h"
                                render={({ field, fieldState: { error } }) => (
                                    <FormControl
                                        label={<TtlFormLabel label="Default TTL" />}
                                        isError={Boolean(error?.message)}
                                        errorText={error?.message}
                                    >
                                        <Input {...field} />
                                    </FormControl>
                                )}
                            />
                        </div>
                        <div className="w-32">
                            <Controller
                                control={control}
                                name="maxTTL"
                                defaultValue="24h"
                                render={({ field, fieldState: { error } }) => (
                                    <FormControl
                                        label={<TtlFormLabel label="Max TTL" />}
                                        isError={Boolean(error?.message)}
                                        errorText={error?.message}
                                    >
                                        <Input {...field} />
                                    </FormControl>
                                )}
                            />
                        </div>
                    </div>
                    <div>
                        <div className="mb-4 mt-4 border-b border-mineshaft-500 pb-2 pl-1 font-medium text-mineshaft-200">
                            Configuration
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center space-x-2">
                                <div className="flex-grow">
                                    <Controller
                                        control={control}
                                        name="provider.url"
                                        render={({ field, fieldState: { error } }) => (
                                            <FormControl
                                                label="URL"
                                                isError={Boolean(error?.message)}
                                                errorText={error?.message}
                                            >
                                                <Input {...field} />
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="provider.binddn"
                                        render={({ field, fieldState: { error } }) => (
                                            <FormControl
                                                label="Bind DN"
                                                isError={Boolean(error?.message)}
                                                errorText={error?.message}
                                            >
                                                <Input {...field} />
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="provider.bindpass"
                                        render={({ field, fieldState: { error } }) => (
                                            <FormControl
                                                label="Bind Password"
                                                isError={Boolean(error?.message)}
                                                errorText={error?.message}
                                            >
                                                <Input {...field} />
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="provider.ca"
                                        render={({ field, fieldState: { error } }) => (
                                            <FormControl
                                                label="CA"
                                                isError={Boolean(error?.message)}
                                                errorText={error?.message}
                                            >
                                                <TextArea {...field} placeholder="-----BEGIN CERTIFICATE----- ..." />    
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="provider.creationLdif"
                                        render={({ field, fieldState: { error } }) => (
                                            <FormControl
                                                label="Creation LDIF"
                                                isError={Boolean(error?.message)}
                                                errorText={error?.message}
                                            >
                                                <TextArea {...field} />
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="provider.revocationLdif"
                                        render={({ field, fieldState: { error } }) => (
                                            <FormControl
                                                label="Revocation LDIF"
                                                isError={Boolean(error?.message)}
                                                errorText={error?.message}
                                            >
                                                <TextArea {...field} />
                                            </FormControl>
                                        )}
                                    />

                                    <Controller
                                        control={control}
                                        name="provider.rollbackLdif"
                                        render={({ field, fieldState: { error } }) => (
                                            <FormControl
                                                label="Rollback LDIF"
                                                isError={Boolean(error?.message)}
                                                errorText={error?.message}
                                            >
                                                <TextArea {...field} />
                                            </FormControl>
                                        )}
                                    />


                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center space-x-4">
                    <Button type="submit" isLoading={isSubmitting}>
                        Submit
                    </Button>
                    <Button variant="outline_bg" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </form>
    )
};