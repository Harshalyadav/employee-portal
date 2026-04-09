"use client";

import { FormEvent, useState } from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateEmailCampaign } from '@/hooks/query/email-campaign.hook';

const DEFAULT_FORM = {
  name: 'Campaign sent via the API',
  subject: 'My subject',
  senderName: 'My HRMS Cloud',
  senderEmail: 'myhrmscloud@gmail.com',
  listIds: '2,7',
  scheduledAt: '',
  htmlContent:
    'Congratulations! You successfully sent this example campaign via the Brevo API.',
};

export default function CampaignsPage() {
  const router = useRouter();
  const [form, setForm] = useState(DEFAULT_FORM);
  const { mutateAsync, isPending } = useCreateEmailCampaign();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const listIds = form.listIds
      .split(',')
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (listIds.length === 0) {
      toast.error('Enter at least one valid Brevo list ID.');
      return;
    }

    await mutateAsync({
      name: form.name.trim(),
      subject: form.subject.trim(),
      senderName: form.senderName.trim(),
      senderEmail: form.senderEmail.trim(),
      htmlContent: form.htmlContent,
      listIds,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      type: 'classic',
    });
  };

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-5">
      <div className="overflow-hidden rounded-3xl border border-gray-100/50 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827]">Create Campaign</h1>
            <p className="mt-1 text-[13px] text-gray-400">
              Send a Brevo classic email campaign from the HRMS dashboard.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2 shadow-sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-6 bg-gray-50/30 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Campaign Name
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Campaign sent via the API"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Subject
                <Input
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  placeholder="My subject"
                  required
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Sender Name
                <Input
                  value={form.senderName}
                  onChange={(event) => setForm((current) => ({ ...current, senderName: event.target.value }))}
                  placeholder="My HRMS Cloud"
                  required
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-gray-700">
                Sender Email
                <Input
                  type="email"
                  value={form.senderEmail}
                  onChange={(event) => setForm((current) => ({ ...current, senderEmail: event.target.value }))}
                  placeholder="myhrmscloud@gmail.com"
                  required
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-gray-700">
              HTML Content
              <Textarea
                value={form.htmlContent}
                onChange={(event) => setForm((current) => ({ ...current, htmlContent: event.target.value }))}
                className="min-h-[220px]"
                placeholder="Enter the HTML or rich content for the campaign"
                required
              />
            </label>
          </div>

          <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <label className="space-y-2 text-sm font-medium text-gray-700">
              Recipient List IDs
              <Input
                value={form.listIds}
                onChange={(event) => setForm((current) => ({ ...current, listIds: event.target.value }))}
                placeholder="2,7"
                required
              />
              <p className="text-xs font-normal text-gray-500">
                Comma-separated Brevo list IDs, for example 2,7.
              </p>
            </label>

            <label className="space-y-2 text-sm font-medium text-gray-700">
              Schedule Time
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
              />
              <p className="text-xs font-normal text-gray-500">
                Leave blank to create the campaign without a scheduled send time.
              </p>
            </label>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
              <p className="font-semibold">Brevo Notes</p>
              <p className="mt-2 text-sky-800">
                The backend uses the Brevo SDK and expects the API key in the backend environment.
                The sender email must be valid in your Brevo account.
              </p>
            </div>

            <Button type="submit" disabled={isPending} className="h-11 w-full gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Create Campaign
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}