from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from decimal import Decimal, ROUND_HALF_UP
from .models import (
    User,
    MasterLocation,
    MasterSource,
    MasterInternalVehicle,
    MasterVendorVehicle,
    RateHistoryInternalVehicle,
    RateHistoryVendor,
    RateHistoryPipeline,
    WaterEntry,
    YieldLocation,
    YieldEntry,
    ConsumptionCategory,
    ConsumptionLocation,
    ConsumptionEntry,
)
from .serializers import (
    UserSerializer,
    MasterLocationSerializer,
    MasterSourceSerializer,
    MasterInternalVehicleSerializer,
    MasterVendorVehicleSerializer,
    RateHistoryInternalVehicleSerializer,
    RateHistoryVendorSerializer,
    RateHistoryPipelineSerializer,
    WaterEntrySerializer,
    YieldLocationSerializer,
    YieldEntrySerializer,
    ConsumptionCategorySerializer,
    ConsumptionLocationSerializer,
    ConsumptionEntrySerializer,
)
from .pagination import StandardResultsSetPagination
from django.db.models import Q
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from django.db import transaction


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class MasterLocationViewSet(viewsets.ModelViewSet):
    queryset = MasterLocation.objects.all().order_by('sort_order', 'location_name')
    serializer_class = MasterLocationSerializer
    pagination_class = None

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        MasterLocation.objects.filter(id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        orders = request.data.get('orders', [])
        if not orders:
            return Response({"error": "No orders provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            for item in orders:
                MasterLocation.objects.filter(id=item['id']).update(sort_order=item['sort_order'])
        
        return Response({"message": "Order updated successfully"})


class MasterSourceViewSet(viewsets.ModelViewSet):
    queryset = MasterSource.objects.all()
    serializer_class = MasterSourceSerializer
    pagination_class = None


class MasterInternalVehicleViewSet(viewsets.ModelViewSet):
    queryset = MasterInternalVehicle.objects.all()
    serializer_class = MasterInternalVehicleSerializer
    pagination_class = None


class MasterVendorVehicleViewSet(viewsets.ModelViewSet):
    queryset = MasterVendorVehicle.objects.all()
    serializer_class = MasterVendorVehicleSerializer
    pagination_class = None


class RateHistoryInternalVehicleViewSet(viewsets.ModelViewSet):
    queryset = RateHistoryInternalVehicle.objects.all().order_by("-effective_date")
    serializer_class = RateHistoryInternalVehicleSerializer


class RateHistoryVendorViewSet(viewsets.ModelViewSet):
    queryset = RateHistoryVendor.objects.all().order_by("-effective_date")
    serializer_class = RateHistoryVendorSerializer


class RateHistoryPipelineViewSet(viewsets.ModelViewSet):
    queryset = RateHistoryPipeline.objects.all().order_by("-effective_date")
    serializer_class = RateHistoryPipelineSerializer


class YieldLocationViewSet(viewsets.ModelViewSet):
    queryset = YieldLocation.objects.all().order_by('yield_type', 'sort_order', 'location_name')
    serializer_class = YieldLocationSerializer
    pagination_class = None

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        YieldLocation.objects.filter(id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        orders = request.data.get('orders', [])
        if not orders:
            return Response({"error": "No orders provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            for item in orders:
                YieldLocation.objects.filter(id=item['id']).update(sort_order=item['sort_order'])
        
        return Response({"message": "Order updated successfully"})


class YieldEntryViewSet(viewsets.ModelViewSet):
    queryset = YieldEntry.objects.all()
    serializer_class = YieldEntrySerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = YieldEntry.objects.all().order_by("-date", "-created_at")
        location_id = self.request.query_params.get("location")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if location_id:
            queryset = queryset.filter(location_id=location_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        ordering = self.request.query_params.get("ordering")
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    from rest_framework.decorators import action

    @action(detail=False, methods=["get"])
    def export(self, request):
        """
        Export yield entries matching filters without pagination
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        location = serializer.validated_data.get('location')
        current_reading = serializer.validated_data.get('current_reading')
        date = serializer.validated_data.get('date')
        
        # Get the previous reading from the latest entry BEFORE this one for this location
        last_entry = YieldEntry.objects.filter(
            location=location,
            date__lte=date
        ).order_by('-date', '-created_at').first()
        
        previous_reading = last_entry.current_reading if last_entry else 0
        
        if location.is_manual_yield:
            # If manual, use the yield_liters from payload if provided
            yield_liters = serializer.initial_data.get('yield_liters')
            # If not provided in initial_data, maybe it's in validated_data if serializer allowed it
            if yield_liters is None:
                yield_liters = serializer.validated_data.get('yield_liters', 0)
        else:
            # Reading is in KL, convert difference to Liters (* 1000)
            yield_difference = (current_reading - previous_reading 
                              if current_reading > previous_reading else 0)
            yield_liters = yield_difference * 1000
        
        serializer.save(
            previous_reading=previous_reading,
            yield_liters=yield_liters,
            created_by=(self.request.user if self.request.user.is_authenticated else None),
        )

    @action(detail=False, methods=["get"])
    def bulk_data(self, request):
        """
        Get all active yield locations and their previous readings for a date.
        """
        target_date_str = request.query_params.get("date")

        if not target_date_str:
            return Response(
                {"error": "date is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST
            )

        locations = YieldLocation.objects.filter(is_active=True).order_by('yield_type', 'sort_order', 'location_name')

        results = []
        for loc in locations:
            # Entry on this exact date
            existing_entry = YieldEntry.objects.filter(location=loc, date=target_date).first()

            # Latest entry strictly before this date
            prev_entry = (
                YieldEntry.objects.filter(location=loc, date__lt=target_date)
                .order_by("-date", "-created_at")
                .first()
            )

            results.append(
                {
                    "location_id": loc.id,
                    "location_name": loc.location_name,
                    "yield_type": loc.yield_type,
                    "is_manual_yield": loc.is_manual_yield,
                    "previous_reading": prev_entry.current_reading if prev_entry else 0,
                    "current_reading": existing_entry.current_reading if existing_entry else "",
                    "comments": existing_entry.comments if existing_entry else "",
                    "existing_yield_liters": existing_entry.yield_liters if (existing_entry and loc.is_manual_yield) else ""
                }
            )

        return Response(results)

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        """
        Create multiple yield entries in one transaction.
        """
        data = request.data
        entries_data = data.get("entries", [])
        entry_date = data.get("date")

        if not entries_data or not entry_date:
            return Response(
                {"error": "entries and date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_entries = []
        try:
            with transaction.atomic():
                for entry in entries_data:
                    loc_id = entry.get("location_id")
                    location = YieldLocation.objects.get(id=loc_id)
                    current_reading = int(entry.get("current_reading") or 0)
                    yield_liters_manual = entry.get("yield_liters")
                    comments = entry.get("comments", "")

                    # Skip logic: 
                    # For normal: skip if current_reading <= 0
                    # For manual: skip only if both current_reading <= 0 AND yield_liters is empty
                    if not location.is_manual_yield:
                        if current_reading <= 0:
                            continue
                    else:
                        if current_reading <= 0 and not yield_liters_manual:
                            continue

                    prev_entry = (
                        YieldEntry.objects.filter(
                            location=location, date__lt=entry_date
                        )
                        .order_by("-date", "-created_at")
                        .first()
                    )

                    previous_reading = prev_entry.current_reading if prev_entry else 0
                    
                    yield_liters_to_save = 0
                    if location.is_manual_yield:
                        yield_liters_to_save = int(entry.get("yield_liters") or 0)
                    else:
                        yield_diff = (
                            current_reading - previous_reading
                            if current_reading > previous_reading
                            else 0
                        )
                        yield_liters_to_save = yield_diff * 1000

                    entry_obj, created = YieldEntry.objects.update_or_create(
                        date=entry_date,
                        location=location,
                        defaults={
                            "current_reading": current_reading,
                            "previous_reading": previous_reading,
                            "yield_liters": yield_liters_to_save,
                            "comments": comments,
                            "created_by": (
                                request.user if request.user.is_authenticated else None
                            ),
                        }
                    )
                    created_entries.append(entry_obj.id)

            return Response(
                {"message": f"Successfully created {len(created_entries)} entries"},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def perform_update(self, serializer):
        location = serializer.validated_data.get('location', serializer.instance.location)
        current_reading = serializer.validated_data.get('current_reading', serializer.instance.current_reading)
        date = serializer.validated_data.get('date', serializer.instance.date)
        
        # Fetch previous reading relative to the updated entry
        last_entry = YieldEntry.objects.filter(
            location=location,
            date__lte=date
        ).exclude(id=serializer.instance.id).order_by('-date', '-created_at').first()
        
        previous_reading = last_entry.current_reading if last_entry else 0
        
        if location.is_manual_yield:
            # For manual, prefer provided yield_liters, else keep current
            yield_liters = serializer.initial_data.get('yield_liters')
            if yield_liters is None:
                yield_liters = serializer.validated_data.get('yield_liters', serializer.instance.yield_liters)
        else:
            yield_difference = (current_reading - previous_reading 
                              if current_reading > previous_reading else 0)
            yield_liters = yield_difference * 1000
        
        serializer.save(
            previous_reading=previous_reading,
            yield_liters=yield_liters
        )


class GetLastYieldReadingView(APIView):
    def get(self, request):
        location_id = request.query_params.get("location_id")
        date_str = request.query_params.get("date")
        
        if not location_id:
            return Response({"error": "location_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        filters = {"location_id": location_id}
        if date_str:
            try:
                look_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                filters["date__lte"] = look_date
            except ValueError:
                pass

        last_entry = YieldEntry.objects.filter(**filters).order_by('-date', '-created_at').first()
        if last_entry:
            return Response({"previous_reading": last_entry.current_reading})
        return Response({"previous_reading": 0})


class ConsumptionCategoryViewSet(viewsets.ModelViewSet):
    queryset = ConsumptionCategory.objects.all()
    serializer_class = ConsumptionCategorySerializer
    pagination_class = None

    @action(detail=False, methods=["delete"])
    def bulk_delete(self, request):
        ids = request.data.get("ids", [])
        if not ids:
            return Response(
                {"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST
            )
        ConsumptionCategory.objects.filter(id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ConsumptionLocationViewSet(viewsets.ModelViewSet):
    queryset = ConsumptionLocation.objects.all().order_by('sort_order', 'location_name')
    serializer_class = ConsumptionLocationSerializer
    pagination_class = None

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({"error": "No IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        ConsumptionLocation.objects.filter(id__in=ids).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        orders = request.data.get('orders', [])
        if not orders:
            return Response({"error": "No orders provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            for item in orders:
                ConsumptionLocation.objects.filter(id=item['id']).update(sort_order=item['sort_order'])
        
        return Response({"message": "Order updated successfully"})


class ConsumptionEntryViewSet(viewsets.ModelViewSet):
    queryset = ConsumptionEntry.objects.all()
    serializer_class = ConsumptionEntrySerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = ConsumptionEntry.objects.all().order_by("-date", "-created_at")
        location_id = self.request.query_params.get("location")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        consumption_type = self.request.query_params.get("consumption_type")
        category_id = self.request.query_params.get("category")

        if location_id:
            queryset = queryset.filter(location_id=location_id)
        if consumption_type:
            queryset = queryset.filter(location__consumption_type=consumption_type)
        if category_id:
            queryset = queryset.filter(location__category_id=category_id)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        ordering = self.request.query_params.get("ordering")
        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    @action(detail=False, methods=["get"])
    def export(self, request):
        """
        Export consumption entries matching filters without pagination
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        location = serializer.validated_data.get("location")
        current_reading = serializer.validated_data.get("current_reading")
        date = serializer.validated_data.get("date")

        last_entry = (
            ConsumptionEntry.objects.filter(location=location, date__lte=date)
            .order_by("-date", "-created_at")
            .first()
        )

        previous_reading = last_entry.current_reading if last_entry else 0
        consumption_difference = (
            current_reading - previous_reading
            if current_reading > previous_reading
            else 0
        )
        consumption_liters = consumption_difference * 1000

        serializer.save(
            previous_reading=previous_reading,
            consumption_liters=consumption_liters,
            created_by=(
                self.request.user if self.request.user.is_authenticated else None
            ),
        )

    def perform_update(self, serializer):
        location = serializer.validated_data.get(
            "location", serializer.instance.location
        )
        current_reading = serializer.validated_data.get(
            "current_reading", serializer.instance.current_reading
        )
        date = serializer.validated_data.get("date", serializer.instance.date)

        last_entry = (
            ConsumptionEntry.objects.filter(location=location, date__lte=date)
            .exclude(id=serializer.instance.id)
            .order_by("-date", "-created_at")
            .first()
        )

        previous_reading = last_entry.current_reading if last_entry else 0
        consumption_difference = (
            current_reading - previous_reading
            if current_reading > previous_reading
            else 0
        )
        consumption_liters = consumption_difference * 1000

        serializer.save(
            previous_reading=previous_reading, consumption_liters=consumption_liters
        )

    @action(detail=False, methods=["get"])
    def bulk_data(self, request):
        """
        Get all active locations for a type and their previous readings for a date.
        """
        target_date_str = request.query_params.get("date")
        consumption_type = request.query_params.get("consumption_type")

        if not target_date_str or not consumption_type:
            return Response(
                {"error": "date and consumption_type are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"error": "Invalid date format"}, status=status.HTTP_400_BAD_REQUEST
            )

        locations = ConsumptionLocation.objects.filter(
            consumption_type=consumption_type, is_active=True
        ).select_related("category").order_by('sort_order', 'location_name')

        results = []
        for loc in locations:
            # Entry on this exact date
            existing_entry = ConsumptionEntry.objects.filter(location=loc, date=target_date).first()
            
            # Latest entry strictly before this date
            prev_entry = (
                ConsumptionEntry.objects.filter(location=loc, date__lt=target_date)
                .order_by("-date", "-created_at")
                .first()
            )

            results.append(
                {
                    "location_id": loc.id,
                    "location_name": loc.location_name,
                    "category_name": loc.category.name if loc.category else "-",
                    "previous_reading": prev_entry.current_reading if prev_entry else 0,
                    "current_reading": existing_entry.current_reading if existing_entry else "",
                    "comments": existing_entry.comments if existing_entry else "",
                }
            )

        return Response(results)

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        """
        Create multiple consumption entries in one transaction.
        """
        data = request.data
        entries_data = data.get("entries", [])
        entry_date = data.get("date")

        if not entries_data or not entry_date:
            return Response(
                {"error": "entries and date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_entries = []
        try:
            with transaction.atomic():
                for entry in entries_data:
                    loc_id = entry.get("location_id")
                    current_reading = Decimal(str(entry.get("current_reading") or 0))
                    comments = entry.get("comments", "")

                    if current_reading <= 0:
                        continue

                    location = ConsumptionLocation.objects.get(id=loc_id)

                    prev_entry = (
                        ConsumptionEntry.objects.filter(
                            location=location, date__lt=entry_date
                        )
                        .order_by("-date", "-created_at")
                        .first()
                    )

                    previous_reading = prev_entry.current_reading if prev_entry else 0
                    consumption_diff = (
                        current_reading - previous_reading
                        if current_reading > previous_reading
                        else 0
                    )

                    entry_obj, created = ConsumptionEntry.objects.update_or_create(
                        date=entry_date,
                        location=location,
                        defaults={
                            "current_reading": current_reading,
                            "previous_reading": previous_reading,
                            "consumption_liters": consumption_diff * 1000,
                            "comments": comments,
                            "created_by": (
                                request.user if request.user.is_authenticated else None
                            ),
                        }
                    )
                    created_entries.append(entry_obj.id)

            return Response(
                {"message": f"Successfully created {len(created_entries)} entries"},
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class GetLastConsumptionReadingView(APIView):
    def get(self, request):
        location_id = request.query_params.get("location_id")
        date_str = request.query_params.get("date")

        if not location_id:
            return Response(
                {"error": "location_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        filters = {"location_id": location_id}
        if date_str:
            try:
                look_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                filters["date__lte"] = look_date
            except ValueError:
                pass

        last_entry = (
            ConsumptionEntry.objects.filter(**filters)
            .order_by("-date", "-created_at")
            .first()
        )
        if last_entry:
            return Response({"previous_reading": last_entry.current_reading})
        return Response({"previous_reading": 0})


from .pagination import StandardResultsSetPagination


class WaterEntryViewSet(viewsets.ModelViewSet):
    queryset = WaterEntry.objects.all()
    serializer_class = WaterEntrySerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = WaterEntry.objects.all().order_by("-entry_date", "-created_at")

        # Filtering
        vehicle_id = self.request.query_params.get("vehicle")
        location_id = self.request.query_params.get("location")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        water_type = self.request.query_params.get("water_type")
        ordering = self.request.query_params.get("ordering")

        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)

        if location_id:
            # Filter by either loading OR unloading location
            from django.db.models import Q

            queryset = queryset.filter(
                Q(loading_location_id=location_id)
                | Q(unloading_location_id=location_id)
            )

        loading_location_id = self.request.query_params.get("loading_location")
        unloading_location_id = self.request.query_params.get("unloading_location")

        if loading_location_id:
            queryset = queryset.filter(loading_location_id=loading_location_id)

        if unloading_location_id:
            queryset = queryset.filter(unloading_location_id=unloading_location_id)

        if start_date:
            queryset = queryset.filter(entry_date__gte=start_date)

        if end_date:
            queryset = queryset.filter(entry_date__lte=end_date)

        if water_type:
            if water_type == "Corporation":
                queryset = queryset.filter(source__source_type="Pipeline")
            elif (
                water_type != "All"
            ):  # 'All' is handled by existing default (no filter)
                queryset = queryset.filter(water_type=water_type)

        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    from rest_framework.decorators import action

    @action(detail=False, methods=["get"])
    def export(self, request):
        """
        Export entries matching filters without pagination
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        self._handle_pipeline_units(serializer)
        serializer.save(created_by=(self.request.user if self.request.user.is_authenticated else None))

    def perform_update(self, serializer):
        self._handle_pipeline_units(serializer)
        serializer.save()

    def _handle_pipeline_units(self, serializer):
        # Check if source is Pipeline and convert KL to Liters
        source_id = serializer.validated_data.get("source")
        # If source_id is an object (due to DRF), get its ID or type
        source = source_id # serializer.validated_data.get("source")
        
        if source and source.source_type == "Pipeline":
            qty = serializer.validated_data.get("total_quantity_liters")
            if qty:
                # Pipeline entries are entered in KL, but stored in Liters
                # We only multiply if it's a new value or significantly changed
                # Actually, standard behavior is KL -> L
                serializer.validated_data["total_quantity_liters"] = qty * 1000



class GetLastPipelineReadingView(APIView):
    """
    Get the last meter reading for a specific Pipeline source
    """

    def get(self, request):
        source_id = request.query_params.get("source_id")
        entry_date_str = request.query_params.get("entry_date")

        if not source_id:
            return Response(
                {"error": "source_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Base filter for this pipeline source
            filters = {"source_id": source_id}

            # If entry_date is provided, look for readings ON or BEFORE that date
            if entry_date_str:
                try:
                    entry_date = datetime.strptime(entry_date_str, "%Y-%m-%d").date()
                    filters["entry_date__lte"] = entry_date
                except ValueError:
                    pass  # Fallback to latest if date is invalid

            # Get the last entry for this pipeline source relative to the date
            last_entry = (
                WaterEntry.objects.filter(**filters)
                .order_by("-entry_date", "-id")
                .first()
            )

            # Also fetch the effective rate for this date to show on frontend
            active_rate = None
            if entry_date_str:
                try:
                    rate_obj = (
                        RateHistoryPipeline.objects.filter(
                            source_id=source_id, effective_date__lte=entry_date
                        )
                        .order_by("-effective_date")
                        .first()
                    )
                    if rate_obj:
                        active_rate = float(rate_obj.cost_per_liter)
                except Exception:
                    pass

            if last_entry and last_entry.meter_reading_current:
                return Response(
                    {
                        "previous_reading": last_entry.meter_reading_current,
                        "active_rate": active_rate,
                    }
                )
            else:
                return Response({"previous_reading": None, "active_rate": active_rate})
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Custom View for Cost Calculation
class CalculateCostView(APIView):
    def post(self, request):
        try:
            data = request.data
            source_type = data.get("source_type")
            source_id = data.get("source_id")
            vehicle_id = data.get("vehicle_id")
            quantity_liters = float(data.get("quantity_liters", 0))
            entry_date_str = data.get("entry_date")

            if not entry_date_str:
                return Response(
                    {"error": "entry_date is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            entry_date = datetime.strptime(entry_date_str, "%Y-%m-%d").date()
            total_cost = 0

            if source_type == "internal":
                # Get vehicle rate based on vehicle AND loading_location
                loading_location_id = data.get("loading_location_id")

                vehicle_rate = (
                    RateHistoryInternalVehicle.objects.filter(
                        vehicle_id=vehicle_id,
                        loading_location_id=loading_location_id,
                        effective_date__lte=entry_date,
                    )
                    .order_by("-effective_date")
                    .first()
                )

                if vehicle_rate:
                    load_count = int(data.get("load_count", 1))
                    cost_per_load = Decimal(str(vehicle_rate.cost_per_load))
                    total_cost = cost_per_load * Decimal(load_count)

            elif source_type == "vendor":
                # Get vendor rate
                water_type = data.get("water_type", "Drinking Water")
                vendor_rate = (
                    RateHistoryVendor.objects.filter(
                        source_id=source_id,
                        water_type=water_type,
                        effective_date__lte=entry_date,
                    )
                    .order_by("-effective_date")
                    .first()
                )

                if vendor_rate:
                    is_manual_override = data.get("is_manual_override", False)

                    # OPTIMIZATION: If Per_Load, calculate directly: Rate * Load Count to avoid precision loss
                    # BUT ONLY IF NOT manual override
                    if vendor_rate.cost_type == "Per_Load" and not is_manual_override:
                        load_count = Decimal(str(data.get("load_count", 1)))
                        total_cost = Decimal(str(vendor_rate.rate_value)) * load_count

                    # Otherwise use stored calculated cost per KL (Partial Loads / Per Liter)
                    elif vendor_rate.calculated_cost_per_kl:
                        cost_per_kl = Decimal(str(vendor_rate.calculated_cost_per_kl))
                        total_cost = (
                            Decimal(str(quantity_liters)) / Decimal("1000")
                        ) * cost_per_kl

                    else:
                        # Fallback calculation
                        cost_per_kl = Decimal("0")
                        if vendor_rate.cost_type == "Per_Liter":
                            cost_per_kl = Decimal(
                                str(vendor_rate.rate_value)
                            ) * Decimal("1000")
                        elif (
                            vendor_rate.cost_type == "Per_Load"
                            and vendor_rate.vehicle_capacity
                        ):
                            cost_per_kl = (
                                Decimal(str(vendor_rate.rate_value))
                                / Decimal(str(vendor_rate.vehicle_capacity))
                            ) * Decimal("1000")

                        total_cost = (
                            Decimal(str(quantity_liters)) / Decimal("1000")
                        ) * cost_per_kl

            elif source_type == "pipeline":
                # Get pipeline rate
                pipeline_rate = (
                    RateHistoryPipeline.objects.filter(
                        source_id=source_id, effective_date__lte=entry_date
                    )
                    .order_by("-effective_date")
                    .first()
                )

                if pipeline_rate:
                    # Pipeline meter readings are in KL, convert to liters (* 1000)
                    quantity_in_liters = Decimal(str(quantity_liters)) * Decimal("1000")
                    total_cost = quantity_in_liters * Decimal(
                        str(pipeline_rate.cost_per_liter)
                    )

            # Round to 2 decimal places for display
            total_cost = float(
                total_cost.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            )

            return Response({"total_cost": total_cost})

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    print(f"DEBUG: Login attempt for username: {username}")
    user = authenticate(username=username, password=password)
    if user:
        print(f"DEBUG: Login successful for user: {user.username}")
        return Response(
            {
                "message": "Login successful",
                "user": UserSerializer(user).data,
                # In a real app, return a token here
            }
        )
    else:
        print(f"DEBUG: Login failed for username: {username}")
        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(["GET"])
def dashboard_stats(request):
    # ... (rest of the file)
    try:
        # Calculate start of current month
        today = date.today()
        start_of_month = today.replace(day=1)

        # 1. Total Cost (This Month)
        total_cost = (
            WaterEntry.objects.filter(entry_date__gte=start_of_month).aggregate(
                Sum("total_cost")
            )["total_cost__sum"]
            or 0
        )

        # 2. Total Volume (This Month) - In KL
        total_volume_liters = (
            WaterEntry.objects.filter(entry_date__gte=start_of_month).aggregate(
                Sum("total_quantity_liters")
            )["total_quantity_liters__sum"]
            or 0
        )
        total_volume_kl = float(total_volume_liters) / 1000

        # 3. Water Type Breakdown
        # Corporation (Pipeline)
        corp_entries = WaterEntry.objects.filter(
            entry_date__gte=start_of_month, source__source_type="Pipeline"
        )
        corp_vol_liters = (
            corp_entries.aggregate(Sum("total_quantity_liters"))[
                "total_quantity_liters__sum"
            ]
            or 0
        )
        corp_cost = corp_entries.aggregate(Sum("total_cost"))["total_cost__sum"] or 0

        # Drinking Water (Excluding Pipeline)
        drink_entries = WaterEntry.objects.filter(
            entry_date__gte=start_of_month, water_type="Drinking Water"
        ).exclude(source__source_type="Pipeline")
        drink_vol_liters = (
            drink_entries.aggregate(Sum("total_quantity_liters"))[
                "total_quantity_liters__sum"
            ]
            or 0
        )
        drink_cost = drink_entries.aggregate(Sum("total_cost"))["total_cost__sum"] or 0

        # Normal Water (Excluding Pipeline) - Filtered by Muthu Nagar Well
        normal_entries = WaterEntry.objects.filter(
            entry_date__gte=start_of_month,
            water_type="Normal Water (Salt)",
            loading_location__location_name__icontains="Muthu Nagar",
        ).exclude(source__source_type="Pipeline")
        normal_vol_liters = (
            normal_entries.aggregate(Sum("total_quantity_liters"))[
                "total_quantity_liters__sum"
            ]
            or 0
        )
        normal_cost = (
            normal_entries.aggregate(Sum("total_cost"))["total_cost__sum"] or 0
        )

        # ...        # 3. Breakdown by Water Type
        breakdown = [
            {
                "type": "Corporation",
                "volume_kl": float(corp_vol_liters) / 1000,
                "liters": float(corp_vol_liters),
                "cost": float(corp_cost),
            },
            {
                "type": "Drinking Water",
                "volume_kl": float(drink_vol_liters) / 1000,
                "liters": float(drink_vol_liters),
                "cost": float(drink_cost),
            },
            {
                "type": "Normal Water",
                "volume_kl": float(normal_vol_liters) / 1000,
                "liters": float(normal_vol_liters),
                "cost": float(normal_cost),
            },
        ]

        # 3.1 Normal Water Purchase Breakdown (Location-wise)
        normal_entries_breakdown = (
            WaterEntry.objects.filter(
                entry_date__gte=start_of_month, water_type="Normal Water (Salt)"
            )
            .exclude(source__source_type="Pipeline")
            .select_related("unloading_location")
        )

        nw_location_data = {}

        for entry in normal_entries_breakdown:
            loc_name = (
                entry.unloading_location.location_name
                if entry.unloading_location
                else "Unknown"
            )

            if loc_name not in nw_location_data:
                nw_location_data[loc_name] = {
                    "location": loc_name,
                    "location_id": entry.unloading_location.id if entry.unloading_location else None,
                    "count_12kl": 0,
                    "count_6kl": 0,
                    "total_liters": 0,
                    "total_amount": 0,
                }

            # Update totals
            nw_location_data[loc_name]["total_liters"] += float(
                entry.total_quantity_liters
            )
            nw_location_data[loc_name]["total_amount"] += float(entry.total_cost)

            # Determine Load Size (12KL or 6KL)
            # Logic: Calculate average load size for this entry
            qty = float(entry.total_quantity_liters)
            load_count = entry.load_count if entry.load_count else 1
            avg_load_size = qty / load_count

            # Thresholds (allowing some variance)
            if (
                avg_load_size >= 10000
            ):  # Broad bucket for 12KL (e.g. 12000, 24000/2=12000)
                nw_location_data[loc_name]["count_12kl"] += load_count
            elif avg_load_size >= 4000:  # Broad bucket for 6KL (e.g. 6000)
                nw_location_data[loc_name]["count_6kl"] += load_count
            # Else: Ignore or add to separate 'Other' bucket?
            # For now, if it doesn't fit, it just contributes to Total Liters/Amount.

        # Convert dictionary to list
        normal_water_breakdown = list(nw_location_data.values())
        normal_water_breakdown.sort(key=lambda x: x["total_amount"], reverse=True)

        # 3.2 Bannari Water Purchase Breakdown (Location-wise)
        bannari_entries_breakdown = (
            WaterEntry.objects.filter(
                entry_date__gte=start_of_month,
                water_type="Normal Water (Salt)",
                loading_location__location_name__icontains="Bannari",
            )
            .exclude(source__source_type="Pipeline")
            .select_related("unloading_location")
        )

        bw_location_data = {}

        for entry in bannari_entries_breakdown:
            loc_name = (
                entry.unloading_location.location_name
                if entry.unloading_location
                else "Unknown"
            )

            if loc_name not in bw_location_data:
                bw_location_data[loc_name] = {
                    "location": loc_name,
                    "location_id": entry.unloading_location.id if entry.unloading_location else None,
                    "count_12kl": 0,
                    "count_6kl": 0,
                    "total_liters": 0,
                    "total_amount": 0,
                }

            # Update totals
            bw_location_data[loc_name]["total_liters"] += float(
                entry.total_quantity_liters
            )
            bw_location_data[loc_name]["total_amount"] += float(entry.total_cost)

            # Determine Load Size
            qty = float(entry.total_quantity_liters)
            load_count = entry.load_count if entry.load_count else 1
            avg_load_size = qty / load_count

            if avg_load_size >= 10000:
                bw_location_data[loc_name]["count_12kl"] += load_count
            elif avg_load_size >= 4000:
                bw_location_data[loc_name]["count_6kl"] += load_count

        bannari_water_breakdown = list(bw_location_data.values())
        bannari_water_breakdown.sort(key=lambda x: x["total_amount"], reverse=True)

        # 3.3 Varahi Water Purchase Breakdown (Location-wise)
        varahi_entries_breakdown = (
            WaterEntry.objects.filter(
                entry_date__gte=start_of_month,
                water_type="Normal Water (Salt)",
                loading_location__location_name__icontains="Varahi",
            )
            .exclude(source__source_type="Pipeline")
            .select_related("unloading_location")
        )

        vw_location_data = {}

        for entry in varahi_entries_breakdown:
            loc_name = (
                entry.unloading_location.location_name
                if entry.unloading_location
                else "Unknown"
            )

            if loc_name not in vw_location_data:
                vw_location_data[loc_name] = {
                    "location": loc_name,
                    "location_id": entry.unloading_location.id if entry.unloading_location else None,
                    "count_12kl": 0,
                    "count_6kl": 0,
                    "total_liters": 0,
                    "total_amount": 0,
                }

            # Update totals
            vw_location_data[loc_name]["total_liters"] += float(
                entry.total_quantity_liters
            )
            vw_location_data[loc_name]["total_amount"] += float(entry.total_cost)

            # Determine Load Size
            qty = float(entry.total_quantity_liters)
            load_count = entry.load_count if entry.load_count else 1
            avg_load_size = qty / load_count

            if avg_load_size >= 10000:
                vw_location_data[loc_name]["count_12kl"] += load_count
            elif avg_load_size >= 4000:
                vw_location_data[loc_name]["count_6kl"] += load_count

        varahi_water_breakdown = list(vw_location_data.values())
        varahi_water_breakdown.sort(key=lambda x: x["total_amount"], reverse=True)

        # 3.4 Monthly Consumption Matrix (Daily KL per Location)
        # Filter for Normal Water (all sources)
        matrix_entries = (
            WaterEntry.objects.filter(
                entry_date__gte=start_of_month, water_type="Normal Water (Salt)"
            )
            .exclude(source__source_type="Pipeline")
            .select_related("unloading_location")
        )

        # Get number of days in current month
        import calendar

        _, num_days = calendar.monthrange(today.year, today.month)
        days = list(range(1, num_days + 1))

        matrix_data = {}
        daily_totals = {d: 0 for d in days}
        grand_total = 0

        for entry in matrix_entries:
            loc_name = (
                entry.unloading_location.location_name
                if entry.unloading_location
                else "Unknown"
            )
            day = entry.entry_date.day
            volume_kl = float(entry.total_quantity_liters) / 1000

            if loc_name not in matrix_data:
                matrix_data[loc_name] = {
                    "location": loc_name,
                    "daily": {d: {"volume": 0, "comments": []} for d in days},
                    "total": 0,
                }

            matrix_data[loc_name]["daily"][day]["volume"] += volume_kl
            if entry.comments:
                matrix_data[loc_name]["daily"][day]["comments"].append(entry.comments)
            matrix_data[loc_name]["total"] += volume_kl
            daily_totals[day] += volume_kl
            grand_total += volume_kl

        # Format matrix for frontend
        formatted_matrix = {
            "days": days,
            "locations": sorted(
                list(matrix_data.values()), key=lambda x: x["location"]
            ),
            "daily_totals": daily_totals,
            "grand_total": grand_total,
            "month_name": today.strftime("%B"),
            "year": today.year,
        }

        # 4. Recent Activity (Last 5)
        recent_entries = WaterEntry.objects.select_related(
            "source", "vehicle"
        ).order_by("-entry_date", "-created_at")[:5]

        recent_data = []
        for entry in recent_entries:
            # Determine source name display logic
            display_source_name = "-"
            if entry.vehicle and entry.loading_location:
                display_source_name = entry.loading_location.location_name
            elif entry.source:
                display_source_name = entry.source.source_name

            recent_data.append(
                {
                    "date": entry.entry_date.strftime("%Y-%m-%d"),
                    "source": display_source_name,
                    "vehicle": entry.vehicle.vehicle_name if entry.vehicle else "-",
                    "volume": f"{float(entry.total_quantity_liters) / 1000:.1f} KL",
                    "cost": float(entry.total_cost),
                }
            )

        return Response(
            {
                "total_cost": float(total_cost),
                "total_volume_kl": float(total_volume_kl),
                "total_volume_liters": float(total_volume_liters),
                "breakdown": breakdown,
                "normal_water_breakdown": normal_water_breakdown,
                "bannari_water_breakdown": bannari_water_breakdown,
                "varahi_water_breakdown": varahi_water_breakdown,  # Added
                "monthly_matrix": formatted_matrix,  # Added
                "recent_activity": recent_data,
            }
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def dropdown_data(request):
    try:
        locations = MasterLocation.objects.filter(is_active=True)
        sources = MasterSource.objects.filter(is_active=True)
        vehicles = MasterInternalVehicle.objects.all()

        return Response(
            {
                "locations": [
                    {
                        "id": l.id,
                        "location_name": l.location_name,
                        "location_type": l.location_type,
                    }
                    for l in locations
                ],
                "sources": [
                    {
                        "id": s.id,
                        "source_name": s.source_name,
                        "source_type": s.source_type,
                    }
                    for s in sources
                ],
                "vehicles": [
                    {
                        "id": v.id,
                        "vehicle_name": v.vehicle_name,
                        "capacity_liters": v.capacity_liters,
                    }
                    for v in vehicles
                ],
            }
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
def multi_month_stats(request):
    try:
        months_count = int(request.query_params.get("months", 3))
        today = date.today()

        # Calculate start date (first day of N months ago)
        start_month_date = today.replace(day=1) - relativedelta(months=months_count - 1)

        # Filter entries: Normal Water, excluding Pipeline
        entries = (
            WaterEntry.objects.filter(
                entry_date__gte=start_month_date,
                entry_date__lte=today,
                water_type="Normal Water (Salt)",
            )
            .exclude(source__source_type="Pipeline")
            .select_related("unloading_location")
        )

        # Generate list of month objects for the range
        month_list = []
        curr = start_month_date
        while curr <= today:
            month_list.append(
                {"key": curr.strftime("%Y-%m"), "label": curr.strftime("%b %Y")}
            )
            # Move to next month
            if curr.month == 12:
                curr = curr.replace(year=curr.year + 1, month=1)
            else:
                curr = curr.replace(month=curr.month + 1)

        matrix_data = {}
        monthly_totals = {m["key"]: {"volume": 0, "cost": 0} for m in month_list}
        grand_total = {"volume": 0, "cost": 0}

        for entry in entries:
            unloading_location = entry.unloading_location
            loc_name = (
                unloading_location.location_name if unloading_location else "Unknown"
            )
            month_key = entry.entry_date.strftime("%Y-%m")
            volume_kl = float(entry.total_quantity_liters) / 1000
            total_cost = float(entry.total_cost or 0)

            if loc_name not in matrix_data:
                matrix_data[loc_name] = {
                    "location": loc_name,
                    "monthly": {m["key"]: {"volume": 0, "cost": 0} for m in month_list},
                    "total": {"volume": 0, "cost": 0},
                }

            if month_key in matrix_data[loc_name]["monthly"]:
                matrix_data[loc_name]["monthly"][month_key]["volume"] += volume_kl
                matrix_data[loc_name]["monthly"][month_key]["cost"] += total_cost
                matrix_data[loc_name]["total"]["volume"] += volume_kl
                matrix_data[loc_name]["total"]["cost"] += total_cost
                monthly_totals[month_key]["volume"] += volume_kl
                monthly_totals[month_key]["cost"] += total_cost
                grand_total["volume"] += volume_kl
                grand_total["cost"] += total_cost

        return Response(
            {
                "months": month_list,
                "locations": sorted(
                    list(matrix_data.values()), key=lambda x: x["location"]
                ),
                "monthly_totals": monthly_totals,
                "grand_total": grand_total,
            }
        )
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
