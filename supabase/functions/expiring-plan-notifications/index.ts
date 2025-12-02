import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 1. Get all active Professional subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('subscriptions')
      .select(
        `
        id,
        user_id,
        current_period_end,
        status,
        profiles:user_id (email, full_name),
        plans:plan_id (name)
      `,
      )
      .eq('status', 'active')
      .filter('plans.name', 'eq', 'Professional')

    if (subError) throw subError

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No active professional subscriptions found',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysFromNow = new Date(today)
    sevenDaysFromNow.setDate(today.getDate() + 7)

    const threeDaysFromNow = new Date(today)
    threeDaysFromNow.setDate(today.getDate() + 3)

    const notificationsSent: any[] = []
    const expiringIn7DaysList: any[] = []

    // Helper to send email (Mocking implementation or using Resend if key exists)
    const sendEmail = async (to: string, subject: string, html: string) => {
      const resendApiKey = Deno.env.get('RESEND_API_KEY')
      if (resendApiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'ProjLAJE <noreply@projlaje.com>',
            to: [to],
            subject: subject,
            html: html,
          }),
        })
      } else {
        console.log(
          `[MOCK EMAIL] To: ${to} | Subject: ${subject} | Content: ${html.substring(0, 50)}...`,
        )
      }
    }

    // Helper to check if notification sent
    const checkNotificationSent = async (
      userId: string,
      type: string,
      refDate: string,
    ) => {
      const { data } = await supabaseClient
        .from('notification_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', type)
        .eq('reference_date', refDate)
        .single()
      return !!data
    }

    // Helper to log notification
    const logNotification = async (
      userId: string,
      type: string,
      refDate: string,
    ) => {
      await supabaseClient.from('notification_logs').insert({
        user_id: userId,
        notification_type: type,
        reference_date: refDate,
      })
    }

    for (const sub of subscriptions) {
      // Need to handle potentially joined arrays or single objects depending on relationship type
      // Assuming standard One-to-One or One-to-Many that results in single object or array
      // profiles and plans are objects here based on select
      const profile = Array.isArray(sub.profiles)
        ? sub.profiles[0]
        : sub.profiles
      const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans

      // Double check it is professional just in case
      if (plan?.name !== 'Professional') continue
      if (!sub.current_period_end) continue

      const endDate = new Date(sub.current_period_end)
      endDate.setHours(0, 0, 0, 0)

      const refDateStr = endDate.toISOString().split('T')[0]

      // Check 7 Days
      if (endDate.getTime() === sevenDaysFromNow.getTime()) {
        const type = '7_days_warning'
        if (!(await checkNotificationSent(sub.user_id, type, refDateStr))) {
          if (profile?.email) {
            await sendEmail(
              profile.email,
              'Sua assinatura ProjLAJE expira em 7 dias',
              `<p>Olá ${profile.full_name || 'Usuário'},</p><p>Sua assinatura Profissional expira em <strong>${refDateStr}</strong>.</p><p>Renove agora para continuar aproveitando todos os benefícios.</p>`,
            )
            await logNotification(sub.user_id, type, refDateStr)
            notificationsSent.push({ user: profile.email, type })
          }
        }
      }

      // Also collect for Admin Report (Next 7 days includes today up to 7 days)
      if (
        endDate.getTime() >= today.getTime() &&
        endDate.getTime() <= sevenDaysFromNow.getTime()
      ) {
        expiringIn7DaysList.push({
          name: profile?.full_name,
          email: profile?.email,
          plan: plan?.name,
          endDate: refDateStr,
        })
      }

      // Check 3 Days
      if (endDate.getTime() === threeDaysFromNow.getTime()) {
        const type = '3_days_warning'
        if (!(await checkNotificationSent(sub.user_id, type, refDateStr))) {
          if (profile?.email) {
            await sendEmail(
              profile.email,
              'IMPORTANTE: Sua assinatura ProjLAJE expira em 3 dias',
              `<p>Olá ${profile.full_name || 'Usuário'},</p><p>Faltam apenas 3 dias para o fim da sua assinatura.</p>`,
            )
            await logNotification(sub.user_id, type, refDateStr)
            notificationsSent.push({ user: profile.email, type })
          }
        }
      }

      // Check Today (Expires Today)
      if (endDate.getTime() === today.getTime()) {
        const type = 'expiration_day'
        if (!(await checkNotificationSent(sub.user_id, type, refDateStr))) {
          if (profile?.email) {
            await sendEmail(
              profile.email,
              'URGENTE: Sua assinatura ProjLAJE expira HOJE',
              `<p>Olá ${profile.full_name || 'Usuário'},</p><p>Sua assinatura expira hoje. Renove agora para evitar interrupções.</p>`,
            )
            await logNotification(sub.user_id, type, refDateStr)
            notificationsSent.push({ user: profile.email, type })
          }
        }
      }
    }

    // Send Admin Daily Summary
    if (expiringIn7DaysList.length > 0) {
      // Find admins
      const { data: admins } = await supabaseClient
        .from('profiles')
        .select('email')
        .eq('is_admin', true)

      if (admins && admins.length > 0) {
        const adminListHtml = expiringIn7DaysList
          .map(
            (u) =>
              `<li><strong>${u.name}</strong> (${u.email}) - Expira em: ${u.endDate}</li>`,
          )
          .join('')

        const adminHtml = `
          <h2>Relatório Diário de Assinaturas Expirando</h2>
          <p>Os seguintes usuários possuem planos expirando nos próximos 7 dias:</p>
          <ul>${adminListHtml}</ul>
        `

        const todayStr = today.toISOString().split('T')[0]
        // Avoid spamming admins if script runs multiple times same day?
        // Assuming cron runs once daily, but we can check logs too if needed.
        // For simplicity, we send it every run if there are matches.

        for (const admin of admins) {
          if (admin.email) {
            await sendEmail(
              admin.email,
              `[Admin] Planos Expirando - ${todayStr}`,
              adminHtml,
            )
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications: notificationsSent,
        adminReportCount: expiringIn7DaysList.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
