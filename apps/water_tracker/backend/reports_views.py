from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncMonth, TruncYear
from datetime import datetime
from decimal import Decimal
from .models import (
    WaterEntry, MasterSource, MasterInternalVehicle, MasterLocation,
    RateHistoryVendor, RateHistoryInternalVehicle, RateHistoryPipeline,
    YieldEntry, YieldLocation, ConsumptionEntry, ConsumptionLocation
)


class MonthlySummaryReportView(APIView):
    """
    Monthly Summary Report - Date-wise breakdown grouped by month
    Query params: ?start_date=2024-01-01&end_date=2024-12-31
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = WaterEntry.objects.all()
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Group by month
            monthly_aggregates = entries.annotate(
                month=TruncMonth('entry_date')
            ).values('month').annotate(
                total_loads=Sum('load_count'),
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            ).order_by('month')

            result_data = []
            
            for item in monthly_aggregates:
                month_entries = entries.filter(
                    entry_date__month=item['month'].month,
                    entry_date__year=item['month'].year
                )
                
                # Breakdown for this month
                month_breakdown = {}
                for water_type in ['Corporation Water', 'Drinking Water', 'Normal Water (Salt)']:
                    if water_type == 'Corporation Water':
                        type_data = month_entries.filter(source__source_type='Pipeline').aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    elif water_type == 'Drinking Water':
                        type_data = month_entries.filter(
                            water_type='Drinking Water'
                        ).exclude(source__source_type='Pipeline').aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    else:
                        type_data = month_entries.filter(water_type=water_type).aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    
                    month_total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                    month_breakdown[water_type] = {
                        'total_kl': float(month_total_kl),
                        'total_cost': float(type_data['total_cost'] or 0)
                    }

                total_kl = (item['total_liters'] or Decimal('0')) / Decimal('1000')
                result_data.append({
                    'month': item['month'].strftime('%Y-%m'),
                    'month_name': item['month'].strftime('%B %Y'),
                    'loads': item['total_loads'],
                    'total_kl': float(total_kl),
                    'total_cost': float(item['total_cost'] or 0),
                    'breakdown': month_breakdown
                })

            # Overall Summary for the selected period
            overall_summary = entries.aggregate(
                total_loads=Sum('load_count'),
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            )
            overall_total_kl = (overall_summary['total_liters'] or Decimal('0')) / Decimal('1000')
            
            overall_breakdown = {}
            for water_type in ['Corporation Water', 'Drinking Water', 'Normal Water (Salt)']:
                if water_type == 'Corporation Water':
                     type_data = entries.filter(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                elif water_type == 'Drinking Water':
                    type_data = entries.filter(water_type='Drinking Water').exclude(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                else:
                    type_data = entries.filter(water_type=water_type).aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                
                overall_type_total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                overall_breakdown[water_type] = {
                    'total_kl': float(overall_type_total_kl),
                    'total_cost': float(type_data['total_cost'] or 0)
                }

            result = {
                'monthly_data': result_data,
                'summary': {
                    'total_loads': overall_summary['total_loads'] or 0,
                    'total_kl': float(overall_total_kl),
                    'total_cost': float(overall_summary['total_cost'] or 0),
                    'breakdown': overall_breakdown
                }
            }
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DailyMovementReportView(APIView):
    """
    Daily Water Movement Report - Date-wise breakdown
    Query params: ?start_date=2024-02-01&end_date=2024-02-28
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = WaterEntry.objects.all()
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Group by date
            daily_data = entries.values('entry_date').annotate(
                loads=Sum('load_count'),
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            ).order_by('entry_date')
            
            result_data = []
            
            for item in daily_data:
                day_entries = entries.filter(entry_date=item['entry_date'])
                
                # Breakdown for this day
                day_breakdown = {}
                for water_type in ['Corporation Water', 'Drinking Water', 'Normal Water (Salt)']:
                    if water_type == 'Corporation Water':
                         type_data = day_entries.filter(source__source_type='Pipeline').aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    elif water_type == 'Drinking Water':
                        type_data = day_entries.filter(water_type='Drinking Water').exclude(source__source_type='Pipeline').aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    else:
                        type_data = day_entries.filter(water_type=water_type).aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    
                    day_total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                    day_breakdown[water_type] = {
                        'total_kl': float(day_total_kl),
                        'total_cost': float(type_data['total_cost'] or 0)
                    }

                total_kl = (item['total_liters'] or Decimal('0')) / Decimal('1000')
                result_data.append({
                    'date': str(item['entry_date']),
                    'loads': item['loads'],
                    'total_kl': float(total_kl),
                    'total_cost': float(item['total_cost'] or 0),
                    'breakdown': day_breakdown
                })

            # Overall Summary for the selected period
            overall_summary_data = entries.aggregate(
                total_loads=Sum('load_count'),
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            )
            overall_summary_data['total_kl'] = (overall_summary_data['total_liters'] or Decimal('0')) / Decimal('1000')
            
            overall_breakdown = {}
            for water_type in ['Corporation Water', 'Drinking Water', 'Normal Water (Salt)']:
                if water_type == 'Corporation Water':
                     type_data = entries.filter(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                elif water_type == 'Drinking Water':
                    type_data = entries.filter(water_type='Drinking Water').exclude(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                else:
                    type_data = entries.filter(water_type=water_type).aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                
                overall_total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                overall_breakdown[water_type] = {
                    'total_kl': float(overall_total_kl),
                    'total_cost': float(type_data['total_cost'] or 0)
                }

            response_payload = {
                'daily_data': result_data,
                'summary': {
                    'total_loads': overall_summary_data['total_loads'] or 0,
                    'total_kl': float(overall_summary_data['total_kl'] or 0),
                    'total_cost': float(overall_summary_data['total_cost'] or 0),
                    'breakdown': overall_breakdown
                }
            }
            
            return Response(response_payload)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class YearlyTrendReportView(APIView):
    """
    Yearly Trend Report - Year-wise aggregates for a range of years
    Query params: ?start_year=2021&end_year=2026
    """
    def get(self, request):
        try:
            start_year = request.query_params.get('start_year')
            end_year = request.query_params.get('end_year')
            
            if not start_year:
                # Default to last 5 years
                end_year_val = int(end_year) if end_year else datetime.now().year
                start_year = str(end_year_val - 4)
                if not end_year:
                    end_year = str(end_year_val)

            entries = WaterEntry.objects.all()
            
            if start_year:
                entries = entries.filter(entry_date__year__gte=start_year)
            if end_year:
                entries = entries.filter(entry_date__year__lte=end_year)
            
            # Group by year
            yearly_aggregates = entries.annotate(
                year=TruncYear('entry_date')
            ).values('year').annotate(
                total_loads=Sum('load_count'),
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            ).order_by('year')

            result_data = []
            
            for item in yearly_aggregates:
                year_val = item['year'].year
                year_entries = entries.filter(entry_date__year=year_val)
                
                # Breakdown for this year
                year_breakdown = {}
                for water_type in ['Corporation Water', 'Drinking Water', 'Normal Water (Salt)']:
                    if water_type == 'Corporation Water':
                        type_data = year_entries.filter(source__source_type='Pipeline').aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    elif water_type == 'Drinking Water':
                        type_data = year_entries.filter(
                            water_type='Drinking Water'
                        ).exclude(source__source_type='Pipeline').aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    else:
                        type_data = year_entries.filter(water_type=water_type).aggregate(
                            total_liters=Sum('total_quantity_liters'),
                            total_cost=Sum('total_cost')
                        )
                    
                    year_total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                    year_breakdown[water_type] = {
                        'total_kl': float(year_total_kl),
                        'total_cost': float(type_data['total_cost'] or 0)
                    }

                total_kl = (item['total_liters'] or Decimal('0')) / Decimal('1000')
                result_data.append({
                    'year': year_val,
                    'loads': item['total_loads'] or 0,
                    'total_kl': float(total_kl),
                    'total_cost': float(item['total_cost'] or 0),
                    'breakdown': year_breakdown
                })

            # Overall Summary for the selected period
            overall_summary_data = entries.aggregate(
                total_loads=Sum('load_count'),
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            )
            overall_total_kl = (overall_summary_data['total_liters'] or Decimal('0')) / Decimal('1000')
            
            overall_breakdown = {}
            for water_type in ['Corporation Water', 'Drinking Water', 'Normal Water (Salt)']:
                if water_type == 'Corporation Water':
                     type_data = entries.filter(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                elif water_type == 'Drinking Water':
                    type_data = entries.filter(
                        water_type='Drinking Water'
                    ).exclude(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                else:
                    type_data = entries.filter(water_type=water_type).aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                
                overall_type_total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                overall_breakdown[water_type] = {
                    'total_kl': float(overall_type_total_kl),
                    'total_cost': float(type_data['total_cost'] or 0)
                }

            result = {
                'yearly_data': result_data,
                'summary': {
                    'total_loads': overall_summary_data['total_loads'] or 0,
                    'total_kl': float(overall_total_kl),
                    'total_cost': float(overall_summary_data['total_cost'] or 0),
                    'breakdown': overall_breakdown
                }
            }
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WaterTypeConsumptionReportView(APIView):
    """
    Water Type Consumption Report - Drinking vs Normal Water (Salt)
    Query params: ?start_date=...&end_date=...
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = WaterEntry.objects.all()
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Group by water type
            by_water_type = {}
            for water_type in ['Drinking Water', 'Normal Water (Salt)', 'Corporation Water']:
                if water_type == 'Corporation Water':
                    type_data = entries.filter(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost'),
                        loads=Count('id')
                    )
                elif water_type == 'Drinking Water':
                    type_data = entries.filter(water_type='Drinking Water').exclude(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost'),
                        loads=Count('id')
                    )
                else:
                    type_data = entries.filter(water_type=water_type).aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost'),
                        loads=Count('id')
                    )
                
                total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                by_water_type[water_type] = {
                    'total_kl': float(total_kl),
                    'total_cost': float(type_data['total_cost'] or 0),
                    'loads': type_data['loads'] or 0
                }
            
            return Response(by_water_type)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VendorUsageReportView(APIView):
    """
    Vendor Usage Report - Loads per vendor and amounts paid
    Query params: ?start_date=...&end_date=...
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = WaterEntry.objects.all()
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Get vendor usage data
            vendor_sources = MasterSource.objects.filter(source_type='Vendor')
            vendor_data_list = []
            for vendor in vendor_sources:
                vendor_data = entries.filter(source=vendor).aggregate(
                    loads=Count('id'),
                    total_liters=Sum('total_quantity_liters'),
                    total_cost=Sum('total_cost')
                )
                
                vendor_total_kl = (vendor_data['total_liters'] or Decimal('0')) / Decimal('1000')
                vendor_data_list.append({
                    'vendor_id': vendor.id,
                    'vendor_name': vendor.source_name,
                    'loads': vendor_data['loads'] or 0,
                    'total_kl': float(vendor_total_kl),
                    'total_cost': float(vendor_data['total_cost'] or 0)
                })

            # Overall summary for selected period
            summary = entries.aggregate(
                total_loads=Sum('load_count'),
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            )
            summary['total_kl'] = (summary['total_liters'] or Decimal('0')) / Decimal('1000')
            
            by_water_type = {}
            for water_type in ['Corporation Water', 'Drinking Water', 'Normal Water (Salt)']:
                if water_type == 'Corporation Water':
                    type_data = entries.filter(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                elif water_type == 'Drinking Water':
                    type_data = entries.filter(water_type='Drinking Water').exclude(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                else:
                    type_data = entries.filter(water_type=water_type).aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost')
                    )
                
                type_total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                by_water_type[water_type] = {
                    'total_kl': float(type_total_kl),
                    'total_cost': float(type_data['total_cost'] or 0)
                }

            response_payload = {
                'vendor_data': vendor_data_list,
                'summary': {
                    'total_loads': summary['total_loads'] or 0,
                    'total_kl': float(summary['total_kl'] or 0),
                    'total_cost': float(summary['total_cost'] or 0),
                    'breakdown': by_water_type
                }
            }
            
            return Response(response_payload)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VehicleUtilizationReportView(APIView):
    """
    Own Vehicle Utilization Report - Internal vehicle trips, KL transported, costs
    Query params: ?start_date=...&end_date=...
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = WaterEntry.objects.filter(source__isnull=True)  # Internal entries
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Get all internal vehicles
            vehicles = MasterInternalVehicle.objects.all()
            
            result = []
            for vehicle in vehicles:
                vehicle_data = entries.filter(vehicle=vehicle).aggregate(
                    trips=Count('id'),
                    total_liters=Sum('total_quantity_liters'),
                    total_cost=Sum('total_cost')
                )
                
                loads = vehicle_data['trips'] or 0
                total_kl = float((vehicle_data['total_liters'] or Decimal('0')) / Decimal('1000'))
                
                result.append({
                    'vehicle_id': vehicle.id,
                    'vehicle_name': vehicle.vehicle_name,
                    'loads': loads,
                    'total_kl': total_kl,
                    'total_cost': float(vehicle_data['total_cost'] or 0)
                })
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CostComparisonReportView(APIView):
    """
    Own vs Vendor Cost Comparison - Cost per KL comparison
    Query params: ?start_date=...&end_date=...
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = WaterEntry.objects.all()
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            result = {}
            
            # Vendor data
            vendor_sources = MasterSource.objects.filter(source_type='Vendor').values_list('id', flat=True)
            vendor_data = entries.filter(source_id__in=vendor_sources).aggregate(
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            )
            vendor_kl = float((vendor_data['total_liters'] or Decimal('0')) / Decimal('1000'))
            vendor_cost = float(vendor_data['total_cost'] or 0)
            cost_per_kl = round(vendor_cost / vendor_kl, 2) if vendor_kl > 0 else 0
            result['vendor'] = {
                'total_kl': vendor_kl,
                'total_cost': vendor_cost,
                'cost_per_kl': cost_per_kl,
                'cost_per_liter': round(Decimal(str(cost_per_kl)) / Decimal('1000'), 4) if cost_per_kl > 0 else 0
            }
            
            # Rathinam vehicle data
            rathinam_data = entries.filter(source__isnull=True).aggregate(
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            )
            rathinam_kl = float((rathinam_data['total_liters'] or Decimal('0')) / Decimal('1000'))
            rathinam_cost = float(rathinam_data['total_cost'] or 0)
            cost_per_kl = round(rathinam_cost / rathinam_kl, 2) if rathinam_kl > 0 else 0
            result['rathinam_vehicles'] = {
                'total_kl': rathinam_kl,
                'total_cost': rathinam_cost,
                'cost_per_kl': cost_per_kl,
                'cost_per_liter': round(Decimal(str(cost_per_kl)) / Decimal('1000'), 4) if cost_per_kl > 0 else 0
            }
            
            # Pipeline data
            pipeline_sources = MasterSource.objects.filter(source_type='Pipeline').values_list('id', flat=True)
            pipeline_data = entries.filter(source_id__in=pipeline_sources).aggregate(
                total_liters=Sum('total_quantity_liters'),
                total_cost=Sum('total_cost')
            )
            pipeline_kl = float((pipeline_data['total_liters'] or Decimal('0')) / Decimal('1000'))
            pipeline_cost = float(pipeline_data['total_cost'] or 0)
            cost_per_kl = round(pipeline_cost / pipeline_kl, 2) if pipeline_kl > 0 else 0
            result['pipeline'] = {
                'total_kl': pipeline_kl,
                'total_cost': pipeline_cost,
                'cost_per_kl': cost_per_kl,
                'cost_per_liter': round(Decimal(str(cost_per_kl)) / Decimal('1000'), 4) if cost_per_kl > 0 else 0
            }
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SiteConsumptionReportView(APIView):
    """
    Unloading Place (Site) Report - Water consumed per site/department
    Query params: ?start_date=...&end_date=...
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = WaterEntry.objects.all()
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Get all locations (exclude Loading points)
            locations = MasterLocation.objects.exclude(location_type='Loading')
            
            result = []
            for location in locations:
                location_data = entries.filter(unloading_location=location).aggregate(
                    total_liters=Sum('total_quantity_liters'),
                    total_loads=Count('id'),
                    total_cost=Sum('total_cost')
                )
                
                location_total_kl = float((location_data['total_liters'] or Decimal('0')) / Decimal('1000'))
                
                result.append({
                    'location_id': location.id,
                    'location_name': location.location_name,
                    'location_type': location.location_type,
                    'total_kl': location_total_kl,
                    'total_loads': location_data['total_loads'] or 0,
                    'total_cost': float(location_data['total_cost'] or 0)
                })
            
            # Sort by consumption
            result = sorted(result, key=lambda x: x['total_kl'], reverse=True)
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CapacityUtilizationReportView(APIView):
    """
    Vehicle Capacity Utilization Report - Actual vs capacity analysis
    Query params: ?start_date=...&end_date=...
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = WaterEntry.objects.filter(source__isnull=True)  # Internal vehicles only
           
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Get all internal vehicles
            vehicles = MasterInternalVehicle.objects.all()
            
            result = []
            for vehicle in vehicles:
                vehicle_entries = entries.filter(vehicle=vehicle)
                
                vehicle_data = vehicle_entries.aggregate(
                    avg_load_liters=Avg('total_quantity_liters'),
                    trips=Count('id')
                )
                
                avg_load = float(vehicle_data['avg_load_liters'] or 0)
                capacity = float(vehicle.capacity_liters) if vehicle.capacity_liters else 0
                
                result.append({
                    'vehicle_name': vehicle.vehicle_name,
                    'capacity_liters': capacity,
                    'avg_load_liters': round(avg_load, 2),
                    'utilization_percentage': round((avg_load / capacity * 100), 2) if capacity > 0 else 0,
                    'trips': vehicle_data['trips'] or 0
                })
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SiteDetailReportView(APIView):
    """
    Site Detail Report - Detailed water consumption for a specific site by water type
    URL params: location_id
    Query params: ?start_date=...&end_date=...
    """
    def get(self, request, location_id):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            # Get the location
            try:
                location = MasterLocation.objects.get(id=location_id)
            except MasterLocation.DoesNotExist:
                return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)
            
            entries = WaterEntry.objects.filter(unloading_location=location)
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Overall totals
            total_data = entries.aggregate(
                total_liters=Sum('total_quantity_liters'),
                total_loads=Count('id'),
                total_cost=Sum('total_cost')
            )
            total_data['total_kl'] = (total_data['total_liters'] or Decimal('0')) / Decimal('1000')
            
            # By water type
            by_water_type = []
            for water_type in ['Drinking Water', 'Normal Water (Salt)', 'Corporation Water']:
                if water_type == 'Corporation Water':
                    type_data = entries.filter(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost'),
                        loads=Count('id')
                    )
                elif water_type == 'Drinking Water':
                    type_data = entries.filter(water_type='Drinking Water').exclude(source__source_type='Pipeline').aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost'),
                        loads=Count('id')
                    )
                else:
                    type_data = entries.filter(water_type=water_type).aggregate(
                        total_liters=Sum('total_quantity_liters'),
                        total_cost=Sum('total_cost'),
                        loads=Count('id')
                    )
                
                type_total_kl = (type_data['total_liters'] or Decimal('0')) / Decimal('1000')
                by_water_type.append({
                    'water_type': water_type,
                    'total_kl': float(type_total_kl),
                    'total_cost': float(type_data['total_cost'] or 0),
                    'loads': type_data['loads'] or 0
                })
            
            # Daily breakdown
            daily_data = entries.values('entry_date', 'water_type', 'source__source_type').annotate(
                total_liters=Sum('total_quantity_liters'),
                cost=Sum('total_cost'),
                loads=Count('id')
            ).order_by('entry_date')
            
            daily_by_date = {}
            for item in daily_data:
                date_str = str(item['entry_date'])
                if date_str not in daily_by_date:
                    daily_by_date[date_str] = {
                        'date': date_str,
                        'Drinking Water': 0,
                        'Drinking Water Cost': 0,
                        'Normal Water (Salt)': 0,
                        'Normal Water (Salt) Cost': 0,
                        'Corporation Water': 0,
                        'Corporation Water Cost': 0,
                        'total_kl': 0,
                        'total_cost': 0
                    }
                
                # Determine water category
                if item['source__source_type'] == 'Pipeline':
                    water_category = 'Corporation Water'
                elif item['water_type'] == 'Drinking Water':
                    water_category = 'Drinking Water'
                else:
                    water_category = item['water_type']
                
                item_kl = float((item['total_liters'] or Decimal('0')) / Decimal('1000'))
                daily_by_date[date_str][water_category] += item_kl
                daily_by_date[date_str][f"{water_category} Cost"] += float(item['cost'] or 0)
                daily_by_date[date_str]['total_kl'] += item_kl
                daily_by_date[date_str]['total_cost'] += float(item['cost'] or 0)
            
            result = {
                'location': {
                    'id': location.id,
                    'name': location.location_name,
                    'type': location.location_type
                },
                'totals': {
                    'total_kl': float(total_data['total_kl']),
                    'total_loads': total_data['total_loads'] or 0,
                    'total_cost': float(total_data['total_cost'] or 0)
                },
                'by_water_type': by_water_type,
                'daily_trend': list(daily_by_date.values())
            }
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VendorDetailReportView(APIView):
    """
    Vendor Detail Report - Detailed water purchase for a specific vendor
    URL params: vendor_id
    Query params: ?start_date=...&end_date=...
    """
    def get(self, request, vendor_id):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            # Get the vendor source
            try:
                vendor = MasterSource.objects.get(id=vendor_id, source_type='Vendor')
            except MasterSource.DoesNotExist:
                return Response({'error': 'Vendor not found'}, status=status.HTTP_404_NOT_FOUND)
            
            entries = WaterEntry.objects.filter(source=vendor)
            
            if start_date:
                entries = entries.filter(entry_date__gte=start_date)
            if end_date:
                entries = entries.filter(entry_date__lte=end_date)
            
            # Overall totals
            total_data = entries.aggregate(
                total_liters=Sum('total_quantity_liters'),
                total_loads=Count('id'),
                total_cost=Sum('total_cost')
            )
            total_data['total_kl'] = (total_data['total_liters'] or Decimal('0')) / Decimal('1000')
            
            # Daily breakdown
            daily_data = entries.values('entry_date', 'unloading_location__location_name', 'water_type').annotate(
                total_liters=Sum('total_quantity_liters'),
                cost=Sum('total_cost'),
                loads=Count('id')
            ).order_by('entry_date')
            
            result_daily = []
            for item in daily_data:
                item_kl = float((item['total_liters'] or Decimal('0')) / Decimal('1000'))
                result_daily.append({
                    'date': str(item['entry_date']),
                    'location_name': item['unloading_location__location_name'],
                    'water_type': item['water_type'],
                    'kl': item_kl,
                    'cost': float(item['cost'] or 0),
                    'loads': item['loads'] or 0
                })
            
            result = {
                'vendor': {
                    'id': vendor.id,
                    'name': vendor.source_name
                },
                'totals': {
                    'total_kl': float(total_data['total_kl']),
                    'total_loads': total_data['total_loads'] or 0,
                    'total_cost': float(total_data['total_cost'] or 0)
                },
                'purchase_history': result_daily
            }
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RateDetailsReportView(APIView):
    """
    Rate Details Report - Current active rates for all sources
    """
    def get(self, request):
        try:
            # 1. Vendor Rates
            vendors = MasterSource.objects.filter(source_type='Vendor', is_active=True)
            vendor_rates = []
            
            for vendor in vendors:
                # Get latest rates for this vendor
                # Normal Water (Salt)
                normal_rate = RateHistoryVendor.objects.filter(
                    source=vendor, 
                    water_type='Normal Water (Salt)'
                ).order_by('-effective_date').first()
                
                # Drinking Water
                drinking_rate = RateHistoryVendor.objects.filter(
                    source=vendor, 
                    water_type='Drinking Water'
                ).order_by('-effective_date').first()
                
                # Calculate missing rates for Normal Water
                normal_per_kl = None
                normal_per_litre = None
                if normal_rate:
                    normal_per_kl = float(normal_rate.calculated_cost_per_kl) if normal_rate.calculated_cost_per_kl is not None else None
                    normal_per_litre = float(normal_rate.calculated_cost_per_liter) if normal_rate.calculated_cost_per_liter is not None else None
                    
                    # On-the-fly calculation if missing
                    if normal_rate.cost_type == 'Per_Load' and normal_rate.vehicle_capacity:
                        if normal_per_kl is None:
                            normal_per_kl = float(normal_rate.rate_value) / (normal_rate.vehicle_capacity / 1000.0)
                        if normal_per_litre is None:
                            normal_per_litre = float(normal_rate.rate_value) / float(normal_rate.vehicle_capacity)

                # Calculate missing rates for Drinking Water
                drinking_per_kl = None
                drinking_per_litre = None
                if drinking_rate:
                    drinking_per_kl = float(drinking_rate.calculated_cost_per_kl) if drinking_rate.calculated_cost_per_kl is not None else None
                    drinking_per_litre = float(drinking_rate.calculated_cost_per_liter) if drinking_rate.calculated_cost_per_liter is not None else None
                    
                    # On-the-fly calculation if missing
                    if drinking_rate.cost_type == 'Per_Load' and drinking_rate.vehicle_capacity:
                        if drinking_per_kl is None:
                            drinking_per_kl = float(drinking_rate.rate_value) / (drinking_rate.vehicle_capacity / 1000.0)
                        if drinking_per_litre is None:
                            drinking_per_litre = float(drinking_rate.rate_value) / float(drinking_rate.vehicle_capacity)

                vendor_rates.append({
                    'vendor_name': vendor.source_name,
                    'is_active': vendor.is_active,
                    'normal': {
                        'capacity': normal_rate.vehicle_capacity if normal_rate else None,
                        'per_load': float(normal_rate.rate_value) if normal_rate and normal_rate.cost_type == 'Per_Load' and normal_rate.rate_value is not None else None,
                        'per_kl': normal_per_kl,
                        'per_litre': normal_per_litre,
                    },
                    'drinking': {
                        'capacity': drinking_rate.vehicle_capacity if drinking_rate else None,
                        'per_load': float(drinking_rate.rate_value) if drinking_rate and drinking_rate.cost_type == 'Per_Load' and drinking_rate.rate_value is not None else None,
                        'per_kl': drinking_per_kl,
                        'per_litre': drinking_per_litre,
                    }
                })

            # 2. Rathinam (Internal) Vehicle Rates
            internal_vehicles = MasterInternalVehicle.objects.all()
            internal_rates = []
            
            for vehicle in internal_vehicles:
                # Internal rates are per vehicle + loading location
                rates = RateHistoryInternalVehicle.objects.filter(
                    vehicle=vehicle
                ).order_by('loading_location__location_name', '-effective_date')
                
                # Get latest rate for each unique loading location for this vehicle
                seen_locations = set()
                location_rates = []
                
                for rate in rates:
                    loc_id = rate.loading_location_id
                    if loc_id not in seen_locations:
                        # On-the-fly calculation for internal vehicles
                        per_kl = float(rate.calculated_cost_per_kl) if rate.calculated_cost_per_kl is not None else None
                        per_liter = float(rate.calculated_cost_per_liter) if rate.calculated_cost_per_liter is not None else None
                        
                        if per_kl is None and rate.cost_per_load is not None and vehicle.capacity_liters:
                            per_kl = float(rate.cost_per_load) / (vehicle.capacity_liters / 1000.0)
                            per_liter = per_kl / 1000.0

                        location_rates.append({
                            'loading_location': rate.loading_location.location_name if rate.loading_location else 'Unknown',
                            'per_load': float(rate.cost_per_load) if rate.cost_per_load is not None else 0.0,
                            'per_kl': per_kl,
                            'per_litre': per_liter,
                            'effective_date': str(rate.effective_date)
                        })
                        seen_locations.add(loc_id)
                
                internal_rates.append({
                    'vehicle_name': vehicle.vehicle_name,
                    'capacity': vehicle.capacity_liters,
                    'location_rates': location_rates
                })

            # 3. Corporation (Pipeline) Rates
            pipelines = MasterSource.objects.filter(source_type='Pipeline', is_active=True)
            pipeline_rates = []
            
            for pipeline in pipelines:
                latest_rate = RateHistoryPipeline.objects.filter(
                    source=pipeline
                ).order_by('-effective_date').first()
                
                if latest_rate:
                    pipeline_rates.append({
                        'source_name': pipeline.source_name,
                        'cost_per_liter': float(latest_rate.cost_per_liter) if latest_rate.cost_per_liter is not None else 0.0,
                        'cost_per_kl': float(latest_rate.cost_per_liter * 1000) if latest_rate.cost_per_liter is not None else 0.0,
                        'effective_date': str(latest_rate.effective_date)
                    })


            return Response({
                'vendor_rates': vendor_rates,
                'internal_rates': internal_rates,
                'pipeline_rates': pipeline_rates
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DailyYieldReportView(APIView):
    """
    Daily Yield Report - Date-wise breakdown of water yield by location
    Query params: ?start_date=2024-02-01&end_date=2024-02-28
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = YieldEntry.objects.all().select_related('location')
            
            if start_date:
                entries = entries.filter(date__gte=start_date)
            if end_date:
                entries = entries.filter(date__lte=end_date)
            
            # Group by date
            daily_data_query = entries.values('date').annotate(
                total_liters=Sum('yield_liters')
            ).order_by('date')
            
            result_data = []
            locations = YieldLocation.objects.filter(is_active=True)
            location_names = [loc.location_name for loc in locations]
            
            for item in daily_data_query:
                day_date = item['date']
                day_entries = entries.filter(date=day_date)
                
                # Breakdown for this day by location
                day_breakdown = {}
                for loc in locations:
                    loc_yield = day_entries.filter(location=loc).aggregate(
                        total_liters=Sum('yield_liters')
                    )['total_liters'] or 0
                    
                    day_breakdown[loc.location_name] = {
                        'yield_kl': float(Decimal(str(loc_yield)) / Decimal('1000'))
                    }

                total_kl = float(Decimal(str(item['total_liters'] or 0)) / Decimal('1000'))
                result_data.append({
                    'date': str(day_date),
                    'total_kl': total_kl,
                    'breakdown': day_breakdown
                })

            # Overall Summary for the selected period
            overall_summary_data = entries.aggregate(
                total_liters=Sum('yield_liters')
            )
            overall_total_kl = float(Decimal(str(overall_summary_data['total_liters'] or 0)) / Decimal('1000'))
            
            overall_breakdown = {}
            for loc in locations:
                loc_total_yield = entries.filter(location=loc).aggregate(
                    total_liters=Sum('yield_liters')
                )['total_liters'] or 0
                
                overall_breakdown[loc.location_name] = {
                    'total_kl': float(Decimal(str(loc_total_yield)) / Decimal('1000'))
                }

            response_payload = {
                'daily_data': result_data,
                'summary': {
                    'total_kl': overall_total_kl,
                    'breakdown': overall_breakdown
                },
                'location_names': location_names
            }
            
            return Response(response_payload)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DailyNormalConsumptionReportView(APIView):
    """
    Daily Normal Water Consumption Report - Date-wise breakdown of water consumption by location
    Query params: ?start_date=2024-02-01&end_date=2024-02-28
    """
    def get(self, request):
        try:
            start_date = request.query_params.get('start_date')
            end_date = request.query_params.get('end_date')
            
            entries = ConsumptionEntry.objects.filter(
                location__consumption_type='Normal'
            ).select_related('location')
            
            if start_date:
                entries = entries.filter(date__gte=start_date)
            if end_date:
                entries = entries.filter(date__lte=end_date)
            
            # Group by date
            daily_data_query = entries.values('date').annotate(
                total_liters=Sum('consumption_liters')
            ).order_by('date')
            
            result_data = []
            locations = ConsumptionLocation.objects.filter(
                consumption_type='Normal', 
                is_active=True
            ).order_by('sort_order', 'location_name')
            
            location_names = [loc.location_name for loc in locations]
            
            for item in daily_data_query:
                day_date = item['date']
                day_entries = entries.filter(date=day_date)
                
                # Breakdown for this day by location
                day_breakdown = {}
                for loc in locations:
                    loc_consumption = day_entries.filter(location=loc).aggregate(
                        total_liters=Sum('consumption_liters')
                    )['total_liters'] or 0
                    
                    day_breakdown[loc.location_name] = {
                        'consumption_kl': float(Decimal(str(loc_consumption)) / Decimal('1000'))
                    }

                total_kl = float(Decimal(str(item['total_liters'] or 0)) / Decimal('1000'))
                result_data.append({
                    'date': str(day_date),
                    'total_kl': total_kl,
                    'breakdown': day_breakdown
                })

            # Overall Summary for the selected period
            overall_summary_data = entries.aggregate(
                total_liters=Sum('consumption_liters')
            )
            overall_total_kl = float(Decimal(str(overall_summary_data['total_liters'] or 0)) / Decimal('1000'))
            
            overall_breakdown = {}
            for loc in locations:
                loc_total_consumption = entries.filter(location=loc).aggregate(
                    total_liters=Sum('consumption_liters')
                )['total_liters'] or 0
                
                overall_breakdown[loc.location_name] = {
                    'total_kl': float(Decimal(str(loc_total_consumption)) / Decimal('1000'))
                }

            response_payload = {
                'daily_data': result_data,
                'summary': {
                    'total_kl': overall_total_kl,
                    'breakdown': overall_breakdown
                },
                'location_names': location_names
            }
            
            return Response(response_payload)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

